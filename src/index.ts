import * as AWS from "aws-sdk"
import * as RX from "rxjs"
import * as RD from "redux"
import * as RO from "redux-observable"
import { AWSBinding } from "./aws_binding"


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