;; Decentralized Prediction Market for Rare Events

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-invalid-amount (err u103))
(define-constant err-insufficient-balance (err u104))
(define-constant err-market-closed (err u105))
(define-constant err-unauthorized (err u106))

;; Data variables
(define-data-var next-market-id uint u0)

;; Data maps
(define-map markets
  { market-id: uint }
  {
    creator: principal,
    description: (string-ascii 256),
    resolution-time: uint,
    total-yes-amount: uint,
    total-no-amount: uint,
    outcome: (optional bool),
    resolved: bool
  }
)

(define-map user-positions
  { market-id: uint, user: principal }
  {
    yes-amount: uint,
    no-amount: uint
  }
)

(define-map user-balances principal uint)

;; Public functions
(define-public (create-market (description (string-ascii 256)) (resolution-time uint))
  (let
    (
      (market-id (var-get next-market-id))
    )
    (asserts! (> resolution-time block-height) err-invalid-amount)
    (map-set markets
      { market-id: market-id }
      {
        creator: tx-sender,
        description: description,
        resolution-time: resolution-time,
        total-yes-amount: u0,
        total-no-amount: u0,
        outcome: none,
        resolved: false
      }
    )
    (var-set next-market-id (+ market-id u1))
    (ok market-id)
  )
)

(define-public (place-bet (market-id uint) (bet-on-yes bool) (amount uint))
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) err-not-found))
      (user-position (default-to { yes-amount: u0, no-amount: u0 }
                                 (map-get? user-positions { market-id: market-id, user: tx-sender })))
      (user-balance (default-to u0 (map-get? user-balances tx-sender)))
    )
    (asserts! (not (get resolved market)) err-market-closed)
    (asserts! (>= user-balance amount) err-insufficient-balance)
    (map-set user-balances tx-sender (- user-balance amount))
    (if bet-on-yes
      (map-set markets { market-id: market-id }
        (merge market { total-yes-amount: (+ (get total-yes-amount market) amount) }))
      (map-set markets { market-id: market-id }
        (merge market { total-no-amount: (+ (get total-no-amount market) amount) }))
    )
    (map-set user-positions
      { market-id: market-id, user: tx-sender }
      {
        yes-amount: (+ (get yes-amount user-position) (if bet-on-yes amount u0)),
        no-amount: (+ (get no-amount user-position) (if bet-on-yes u0 amount))
      }
    )
    (ok true)
  )
)

(define-public (resolve-market (market-id uint) (outcome bool))
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) err-not-found))
    )
    (asserts! (is-eq tx-sender (get creator market)) err-unauthorized)
    (asserts! (>= block-height (get resolution-time market)) err-unauthorized)
    (asserts! (not (get resolved market)) err-market-closed)
    (map-set markets { market-id: market-id }
      (merge market { outcome: (some outcome), resolved: true })
    )
    (ok true)
  )
)

(define-public (claim-winnings (market-id uint))
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) err-not-found))
      (user-position (unwrap! (map-get? user-positions { market-id: market-id, user: tx-sender }) err-not-found))
      (outcome (unwrap! (get outcome market) err-market-closed))
      (total-pool (+ (get total-yes-amount market) (get total-no-amount market)))
      (winning-pool (if outcome (get total-yes-amount market) (get total-no-amount market)))
      (user-winning-amount (if outcome (get yes-amount user-position) (get no-amount user-position)))
      (winnings (/ (* user-winning-amount total-pool) winning-pool))
    )
    (asserts! (get resolved market) err-market-closed)
    (map-set user-positions { market-id: market-id, user: tx-sender }
      { yes-amount: u0, no-amount: u0 }
    )
    (map-set user-balances tx-sender
      (+ (default-to u0 (map-get? user-balances tx-sender)) winnings)
    )
    (ok winnings)
  )
)

(define-public (deposit (amount uint))
  (let
    (
      (sender-balance (default-to u0 (map-get? user-balances tx-sender)))
    )
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set user-balances tx-sender (+ sender-balance amount))
    (ok true)
  )
)

(define-public (withdraw (amount uint))
  (let
    (
      (sender-balance (default-to u0 (map-get? user-balances tx-sender)))
    )
    (asserts! (>= sender-balance amount) err-insufficient-balance)
    (try! (as-contract (stx-transfer? amount (as-contract tx-sender) tx-sender)))
    (map-set user-balances tx-sender (- sender-balance amount))
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-market (market-id uint))
  (map-get? markets { market-id: market-id })
)

(define-read-only (get-user-position (market-id uint) (user principal))
  (map-get? user-positions { market-id: market-id, user: user })
)

(define-read-only (get-user-balance (user principal))
  (default-to u0 (map-get? user-balances user))
)
