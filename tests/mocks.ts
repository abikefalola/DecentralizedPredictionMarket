import { sha256 } from 'crypto-hash'

class MockNet {
	private submissions: Map<number, any> = new Map()
	private authorizedParties: Map<string, boolean> = new Map()
	private nextSubmissionId: number = 0
	
	createClient() {
		return {
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

