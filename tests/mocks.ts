class MockNet {
	private markets: Map<number, any> = new Map();
	private userPositions: Map<string, any> = new Map();
	private userBalances: Map<string, number> = new Map();
	private nextMarketId: number = 0;
	private submissions: Map<number, any> = new Map()
	private authorizedParties: Map<string, boolean> = new Map()
	private nextSubmissionId: number = 0
	
	createClient() {
		return {
			createMarket: this.createMarket.bind(this),
			placeBet: this.placeBet.bind(this),
			resolveMarket: this.resolveMarket.bind(this),
			claimWinnings: this.claimWinnings.bind(this),
			deposit: this.deposit.bind(this),
			withdraw: this.withdraw.bind(this),
			submitWhistleblowerInfo: this.submitWhistleblowerInfo.bind(this),
			addAuthorizedParty: this.addAuthorizedParty.bind(this),
			removeAuthorizedParty: this.removeAuthorizedParty.bind(this),
			isPartyAuthorized: this.isPartyAuthorized.bind(this),
			revealSubmission: this.revealSubmission.bind(this),
			getSubmission: this.getSubmission.bind(this),
			encryptData: this.encryptData.bind(this),
			decryptData: this.decryptData.bind(this),
		}
	}
	
	async createMarket(description: string, resolutionTime: number) {
		const marketId = this.nextMarketId++;
		this.markets.set(marketId, {
			description,
			resolutionTime,
			totalYesAmount: 0,
			totalNoAmount: 0,
			resolved: false,
			outcome: null,
		});
		return { success: true, value: marketId };
	}
	
	async placeBet(marketId: number, betOnYes: boolean, amount: number) {
		const market = this.markets.get(marketId);
		if (!market || market.resolved) {
			return { success: false, error: 105 }; // err-market-closed
		}
		if (betOnYes) {
			market.totalYesAmount += amount;
		} else {
			market.totalNoAmount += amount;
		}
		return { success: true };
	}
	
	async resolveMarket(marketId: number, outcome: boolean) {
		const market = this.markets.get(marketId);
		if (!market) {
			return { success: false, error: 101 }; // err-not-found
		}
		market.resolved = true;
		market.outcome = outcome;
		return { success: true };
	}
	
	async claimWinnings(marketId: number) {
		const market = this.markets.get(marketId);
		if (!market || !market.resolved) {
			return { success: false, error: 105 }; // err-market-closed
		}
		// In a real implementation, we would calculate winnings here
		return { success: true, value: 100 }; // Mock winnings
	}
	
	async deposit(amount: number) {
		return { success: true };
	}
	
	async withdraw(amount: number) {
		return { success: true };
	}
	
	async submitWhistleblowerInfo(encryptedContent: string, conditions: string[]) {
		const submissionId = this.nextSubmissionId++
		this.submissions.set(submissionId, {
			encryptedContent,
			conditions,
			revealed: false,
		})
		return { success: true, value: submissionId }
	}
	
	async addAuthorizedParty(party: string) {
		this.authorizedParties.set(party, true)
		return { success: true }
	}
	
	async removeAuthorizedParty(party: string) {
		this.authorizedParties.delete(party)
		return { success: true }
	}
	
	async isPartyAuthorized(party: string) {
		return { success: true, value: this.authorizedParties.get(party) || false }
	}
	
	async revealSubmission(submissionId: number) {
		const submission = this.submissions.get(submissionId)
		if (!submission) {
			return { success: false, error: 101 } // err-not-found
		}
		submission.revealed = true
		return { success: true }
	}
	
	async getSubmission(submissionId: number) {
		const submission = this.submissions.get(submissionId)
		if (!submission) {
			return { success: false, error: 101 } // err-not-found
		}
		return {
			success: true,
			value: {
				revealed: submission.revealed,
				'encrypted-content': submission.encryptedContent,
				conditions: submission.conditions
			}
		}
	}
	
	async encryptData(data: string, publicKey: string) {
		// Simple mock encryption (XOR with public key)
		const result = this.xorBuffers(Buffer.from(data.slice(2), 'hex'), Buffer.from(publicKey.slice(2), 'hex'))
		return { success: true, value: '0x' + result.toString('hex') }
	}
	
	async decryptData(encryptedData: string, privateKey: string) {
		// Simple mock decryption (XOR with private key)
		const result = this.xorBuffers(Buffer.from(encryptedData.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))
		return { success: true, value: '0x' + result.toString('hex') }
	}
	
	private xorBuffers(buff1: Buffer, buff2: Buffer): Buffer {
		const result = Buffer.alloc(Math.max(buff1.length, buff2.length))
		for (let i = 0; i < result.length; i++) {
			result[i] = (buff1[i] || 0) ^ (buff2[i] || 0)
		}
		return result
	}
}

export const mockNet = new MockNet()

