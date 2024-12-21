import './App.css';

import Web3 from 'web3';
import { contractAbi, contractAddress } from './utils/constants';
import { useState } from 'react';
import { poseidon3 } from 'poseidon-lite'

// needed for esLint:
/* global BigInt */


const web3 = new Web3("ws://localhost:8545")
const didContract = new web3.eth.Contract(contractAbi, contractAddress);

// attempted to follow this tutorial 
// https://medium.com/coinmonks/build-a-web-3-application-with-solidity-hardhat-react-and-web3js-61b7ff137885
// generates a DID and prints to the console, but allows to do it only once (revert of second attempt)

// another helpful boilerplate to use...
// https://hardhat.org/tutorial/boilerplate-project
// https://github.com/NomicFoundation/hardhat-boilerplate/tree/master/frontend 

function App() {

	/**
	 *
	 *    User side - registerIdentity
	 *
	 * */

	const [didOutput, setDidOutput] = useState("");

	const registerIdentity = async () => {
		let holder = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account 1
		let issuer = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Account 2
		let issuerToDecimalString = BigInt(issuer.toLowerCase()).toString(10);
		let nowDecimalString = new Date().getMilliseconds().toString();
		// following is a 512 character hexadecimal string, typical for a fingerprint template
		let biometricMockString = "a24f98a8b2c2ffcf6d7777e73ebe756f7e944316056ef5afbe347a3437d760761c3b6bb70b6a43ae09a7a56b623b67d251d9d8f62ac5df73275e5e140afa4afbc3cdd8517b5abd600ac9421a11b39780cec000b82b23ae1af9f71262baf3fedeac24a7f3b7c7c5e81d2bb46002c4a2cfee775b1c650b4d3b365fbb3ecd9727c3d26188604c03a12ac6f1552d2342f9356b9fbec6cbc9bde85d900e243b92a1445da3401ce42a5db8168a75953ae44c3256b1ef73509fc1d264bbb9fd37fb8af730f8600b576bcbf1f1cfd766d4ee8dcf1bfb46ade5474c053d4f9298105c7740a4906532640c00c3b17987ec129d2ffe6b6fb34aea851eb8e601d956e1af78e0"
		let biometricDecimalString = BigInt("0x" + biometricMockString).toString(10);

		const ubaasDID = poseidon3([biometricDecimalString, issuerToDecimalString, nowDecimalString], 1).toString();

		await didContract.methods.register(holder, ubaasDID).send({from: holder});
		const did = await didContract.methods.getInfo(holder).call();

		const didData = `Holder is: ${holder}\n\nIssuer is: ${issuer}\n\nDate is: ${nowDecimalString}\n\nBiometric template Mock is: ${biometricMockString}\n\nDID is: ${did[0]}`;
		setDidOutput(didData);

		return did[0];
	};

	/**
	 *
	 *    Verifier side - recompute DID and verify
	 *
	 * */

	const [holderAddress, setHolderAddress] = useState("");
	const [mockString, setMockString] = useState("");
	const [issuerInput, setIssuerInput] = useState("");
	const [timestampInput, setTimestampInput] = useState("");
	const [verificationResult, setVerificationResult] = useState("");
	const [executionTime, setExecutionTime] = useState("");

	const verifyDID = async () => {
		try {

			const startTime = performance.now();

			const chainDIDContract = await didContract.methods.getInfo(holderAddress).call();
			const chainDID = chainDIDContract[0];

			const biometricDecimalString = BigInt("0x" + mockString).toString(10);
			const issuerToDecimalString = BigInt(issuerInput.toLowerCase()).toString(10);


			const recomputedDID = poseidon3([biometricDecimalString, issuerToDecimalString, timestampInput], 1).toString();

			console.log("issuerToDecimalString: ", issuerToDecimalString + " timestamp: ", timestampInput + " biometric: ", biometricDecimalString + " recomputedDID: ", recomputedDID);
			console.log("chainDID: ", chainDID);
			console.log("verification: ", recomputedDID === chainDID);

			// Comparison
			if (recomputedDID === chainDID) {
				setVerificationResult("Verification successful. Template and DID match.");
			} else {
				setVerificationResult("Verification failed. Invalid inputs.");
			}

			const endTime = performance.now();
			const duration = (endTime - startTime).toFixed(2);
			setExecutionTime(duration);

		} catch (error) {
			console.error("Verification error: ", error);
			setVerificationResult("Verification failed. Check log.");
		}
	};

	return (
		<div className='page-container'>

			<div className='main-content'>

				{/* USER SIDE */}
				<div className='card'>
					<h2>User</h2>
					<button className='read' onClick={registerIdentity}>
						Generate DID
					</button>
					<div>
						<h3>Log Output:</h3>
						<textarea
							readOnly
							value={didOutput}
							className={'textarea'}
						/>
					</div>
				</div>

				{/* VERIFIER SIDE */}
				<div className='card'>

					<h2>Verifier</h2>
					<div>
						<div className="form-row">
							<label>Holder Address:</label>
								<input
									type="text"
									value={holderAddress}
									onChange={(e) => setHolderAddress(e.target.value)}
									placeholder="Enter holder address"
								/>
						</div>

						<div className="form-row">
							<label>Issuer Address:</label>
							<input
								type="text"
								value={issuerInput}
								onChange={(e) => setIssuerInput(e.target.value)}
								placeholder="Enter issuer address"
								/>
						</div>

						<div className="form-row">
							<label>Timestamp:</label>
							<input
								type="text"
								value={timestampInput}
								onChange={(e) => setTimestampInput(e.target.value)}
								placeholder="Enter timestamp"
								/>
						</div>

						<div className="form-row">
							<label>Biometric Template:</label>
							<input
								type="text"
								value={mockString}
								onChange={(e) => setMockString(e.target.value)}
								placeholder="Enter Biometric Template"
							/>
						</div>

						<div>
							<br/>
							<button onClick={verifyDID}>Verify DID</button>

							<p>Verification result: {verificationResult} <br/> Execution time: {executionTime} ms</p>
						</div>

						</div>
					</div>


				</div>
			</div>
			);
			}

			export default App;
