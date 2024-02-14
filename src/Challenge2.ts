import { Field, SmartContract, State, state, method, ZkProgram, Provable } from 'o1js';
import { Prover } from "./Prover.js"

const { verificationKey } = await Prover.compile();

class ProverProof extends ZkProgram.Proof(Prover) {}

export class Challenge2 extends SmartContract {
  @state(Field) messageNumber = State<Field>();

  @method initState() {
    super.init();
  }

  @method processMessages(proof: ProverProof) {
    proof.verify();

    const messageNumber = this.messageNumber.getAndRequireEquals();
    const calculatedMessageNumber = proof.publicOutput;

    const statement = calculatedMessageNumber.greaterThan(messageNumber);
    
    const newMessageNumber = Provable.if(
      statement,
      Field,
      calculatedMessageNumber,
      messageNumber
    );

    this.messageNumber.set(newMessageNumber);
  }
}