import { Bool, Field, Provable, SelfProof, ZkProgram } from "o1js"

function checkIsValid(agentId: Field, agentXLocation: Field, agentYLocation: Field, checkSum: Field): Bool {
    const checkAgentId = agentId.greaterThanOrEqual(0).and(agentId.lessThanOrEqual(3000));
    const checkAgentXLocation = agentXLocation.greaterThanOrEqual(0).and(agentId.lessThanOrEqual(15000));
    const checkAgentYLocation = agentYLocation.greaterThanOrEqual(5000).and(agentId.lessThanOrEqual(20000));
    const checkSumState = agentId.add(agentXLocation).add(agentYLocation).equals(checkSum);
    const checkGreaterState = agentYLocation.greaterThan(agentXLocation);

    const isValid = checkAgentId
        .and(checkAgentXLocation)
        .and(checkAgentYLocation)
        .and(checkSumState)
        .and(checkGreaterState)

    return isValid;
}

export const Prover = ZkProgram({
    name: "prover",
    publicInput: Field,
    publicOutput: Field,
    
    methods: {
        baseCase: {
            privateInputs: [],

            method(publicInput: Field) {
                publicInput.assertEquals(0);
                
                return publicInput;
            }
        },
        
        step: {
            privateInputs: [SelfProof, Field, Field, Field, Field],

            method(messageNumber: Field, earlierProof: SelfProof<Field, Field>, agentId: Field, agentXLocation: Field, agentYLocation: Field, checkSum: Field) {
                earlierProof.verify();

                const agentState = agentId.equals(0);
                const messageNumberState = earlierProof.publicInput.greaterThan(messageNumber);
                
                const isAlreadyValid = agentState.or(messageNumberState);
                const checkMessageDetails = checkIsValid(agentId, agentXLocation, agentYLocation, checkSum);

                const isValid = isAlreadyValid.or(checkMessageDetails);
                
                return Provable.if(
                    isValid,
                    Field,
                    messageNumber,
                    earlierProof.publicOutput
                )
            }
        }
    }
})