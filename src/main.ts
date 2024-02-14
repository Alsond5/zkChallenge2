import { Challenge2 } from './Challenge2.js';
import {
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
  PublicKey
} from 'o1js';
import {
  Prover
} from "./Prover.js"

const useProof = false;

const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
// create an instance of Square - and deploy it to zkAppAddress
const zkAppInstance = new Challenge2(zkAppAddress);

const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

let txn = await Mina.transaction(deployerAccount, () => {
    zkAppInstance.initState();
});
await txn.prove();
await txn.sign([deployerKey, zkAppPrivateKey]).send();

let proof = await Prover.baseCase(Field(0));

const messages = [
  {
    messageNumber: Field(1),
    agentId: Field(2),
    agentXLocation: Field(100),
    agentYLocation: Field(5000),
    checkSum: Field(5103)
  },
  {
    messageNumber: Field(2),
    agentId: Field(0),
    agentXLocation: Field(200),
    agentYLocation: Field(5000),
    checkSum: Field(5103)
  }
]

for (const iterator of messages) {
  proof = await Prover.step(iterator.messageNumber, proof, iterator.agentId, iterator.agentXLocation, iterator.agentYLocation, iterator.checkSum);
}

txn = await Mina.transaction(deployerAccount, () => {
    zkAppInstance.processMessages(proof);
});
await txn.prove();
await txn.sign([deployerKey]).send();

console.log("Message Number:", zkAppInstance.messageNumber.get().toBigInt());