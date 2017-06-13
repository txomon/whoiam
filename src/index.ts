import * as AWS from "aws-sdk"
import * as RX from "rxjs"
import * as RD from "redux"
import * as RO from "redux-observable"
import * as IM from "immutable"



// Actions
const CREATE_USER = 'CREATE_USER'

interface UserAction {
    type: string,
    payload: {
        username: string,
    }
}

interface UserState {
    readonly users: AWS.IAM.User[],
    readonly processingUsers: Map<string, string>,
}

function userReducer(state: UserState = { users: [], processingUsers: new Map() }, action: UserAction): UserState {
    var imstate: IM.Collection<UserState> = IM.fromJS(state)
    switch (action.type) {
        case CREATE_USER:
            return imstate.setIn
        default:
            return imstate
    }
}

class AWSStore {
    store: any
    binding: AWSBinding
    policies: AWS.IAM.Policy[]
    users: Map<AWS.IAM.User, string[]>
    groups: Map<AWS.IAM.Group, string[]>
    lastUpdate: number
    delaySeconds: number


    constructor(delaySeconds: number) {
        this.binding = new AWSBinding()
        this.store = RD.createStore(
            this.createRootReducer(),
            RD.applyMiddleware(
                RO.createEpicMiddleware(this.createRootEpic())
            )
        )
        this.delaySeconds = delaySeconds || 300;
        this.lastUpdate = 0;
    }
    createRootReducer(): any {

    }
    createRootEpic(): any {

    }


    createUser(username: string) {


    }
}



var awsstore = new AWSBinding()
awsstore
    .awsListPolicies()
    .subscribe(
    (next) => console.log(`Received`, next),
    (error) => console.log(`Error`, error),
    () => console.log(`Completed`)
    )