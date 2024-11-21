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

