import * as AWS from "aws-sdk"
import * as RX from "rxjs"
import * as RD from "redux"
import * as RO from "redux-observable"
import * as IM from "immutable"
import {} from "./models"

class AWSBinding {
    iamCli: AWS.IAM
    awsStore: AWSStore

    constructor(delaySeconds?: number) {
        this.iamCli = new AWS.IAM()
    }

    awsGetPolicy(): RX.Observable<AWS.IAM.Policy> {
        return RX.Observable.fromPromise(this.iamCli.getPolicy().promise())
            .map((value, index) => value.Policy)
    }

    awsListPolicies(marker?: string): RX.Observable<AWS.IAM.Policy> {
        var params: AWS.IAM.ListPoliciesRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listPolicies(params).promise())
            .concatMap((value, index) => {
                var policies = value.Policies ? value.Policies : []
                if (value.IsTruncated) {
                    return RX.Observable.from(policies)
                        .concat(this.awsListPolicies(value.Marker))
                } else {
                    return RX.Observable.from(policies)
                }
            })
    }


    awsGetUser(username: string): RX.Observable<AWS.IAM.User> {
        return RX.Observable.fromPromise(this.iamCli.getUser({ UserName: username }).promise())
            .concatMap((value, index) => {
                if (value.User.Path.startsWith('/emails/')) {
                    return RX.Observable.of(value.User)
                }
                return RX.Observable.empty()
            })
    }

    awsListUsers(marker?: string): RX.Observable<AWS.IAM.User> {
        var params: AWS.IAM.ListUsersRequest = { MaxItems: 1000, PathPrefix: '/emails/' }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listUsers(params).promise())
            .concatMap((value, index) => {
                var users = value.Users ? value.Users : []
                if (value.IsTruncated) {
                    return RX.Observable.from(users)
                        .concat(this.awsListUsers(value.Marker))
                } else {
                    return RX.Observable.from(users)
                }
            })
    }

    awsCreateUser(username: string): RX.Observable<AWS.IAM.User> {
        var params: AWS.IAM.CreateUserRequest = { UserName: username, Path: '/emails/' }
        return RX.Observable.fromPromise(this.iamCli.createUser(params).promise())
            .concatMap((value, index) => {
                if (value.User) {
                    return RX.Observable.of(value.User)
                }
                return RX.Observable.empty()
            })
    }

    awsDeleteUser(username: string): RX.Observable<{}> {
        var params: AWS.IAM.DeleteUserRequest = { UserName: username }
        return RX.Observable.fromPromise(this.iamCli.deleteUser(params).promise())
            .concatMap((value, index) => {
                return RX.Observable.empty()
            })
    }

    awsGetGroup(groupname: string): RX.Observable<Map<AWS.IAM.Group, AWS.IAM.User[]>> {
        return RX.Observable.fromPromise(this.iamCli.getGroup({ GroupName: groupname }).promise())
            .concatMap((value, index) => {
                var groupResult: Map<AWS.IAM.Group, AWS.IAM.User[]> = new Map([[value.Group, value.Users]])
                if (value.IsTruncated) {
                    return RX.Observable.of(groupResult)
                        .concat(this.awsListGroups(value.Marker))
                } else {
                    return RX.Observable.of(groupResult)
                }
            })
    }

    awsListGroups(marker?: string): RX.Observable<AWS.IAM.Group> {
        var params: AWS.IAM.ListGroupsRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listGroups(params).promise())
            .concatMap((value, index) => {
                if (value.IsTruncated) {
                    return RX.Observable.from(value.Groups)
                        .concat(this.awsListGroups(value.Marker))
                } else {
                    return RX.Observable.from(value.Groups)
                }
            })
    }

    awsCreateGroup(username: string): RX.Observable<AWS.IAM.Group> {
        var params: AWS.IAM.CreateGroupRequest = { GroupName: username, Path: '/emails/' }
        return RX.Observable.fromPromise(this.iamCli.createGroup(params).promise())
            .concatMap((value, index) => {
                if (value.Group) {
                    return RX.Observable.of(value.Group)
                }
                return RX.Observable.empty()
            })
    }

    awsDeleteGroup(groupname: string): RX.Observable<{}> {
        var params: AWS.IAM.DeleteGroupRequest = { GroupName: groupname }
        return RX.Observable.fromPromise(this.iamCli.deleteGroup(params).promise())
            .concatMap((value, index) => {
                return RX.Observable.empty()
            })
    }

    awsAttachUserPolicy(username: string, policyArn: string): RX.Observable<{}> {
        var params: AWS.IAM.AttachUserPolicyRequest = { PolicyArn: policyArn, UserName: username }
        return RX.Observable.fromPromise(this.iamCli.attachUserPolicy(params).promise())
            .concatMap((value, index) => {
                return RX.Observable.empty()
            })
    }

    awsDetachUserPolicy(username: string, policyArn: string): RX.Observable<{}> {
        var params: AWS.IAM.DetachUserPolicyRequest = { PolicyArn: policyArn, UserName: username }
        return RX.Observable.fromPromise(this.iamCli.detachUserPolicy(params).promise())
            .concatMap((value, index) => {
                return RX.Observable.empty()
            })
    }


    awsListAttachedUserPolicies(username: string, marker?: string): RX.Observable<string> {
        var params: AWS.IAM.ListAttachedUserPoliciesRequest = { MaxItems: 1000, UserName: username }
        if (marker) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listAttachedUserPolicies(params).promise())
            .concatMap((value, index) => {
                if (!value.AttachedPolicies) {
                    return RX.Observable.from([])
                }
                var policies: string[] = []
                for (let attachedPolicy of value.AttachedPolicies) {
                    if (!attachedPolicy.PolicyArn) {
                        console.log(`${username} UserPolicyAttachment doens't have ARN => ${attachedPolicy.PolicyName}(arn:${attachedPolicy.PolicyArn})`)
                        continue
                    }
                    policies.push(attachedPolicy.PolicyArn)
                }
                if (value.IsTruncated) {
                    return RX.Observable.from(policies)
                        .concat(this.awsListAttachedUserPolicies(username, value.Marker))
                } else {
                    return RX.Observable.from(policies)
                }
            })
    }

    awsAttachGroupPolicy(groupname: string, policyArn: string): RX.Observable<{}> {
        var params: AWS.IAM.AttachGroupPolicyRequest = { PolicyArn: policyArn, GroupName: groupname }
        return RX.Observable.fromPromise(this.iamCli.attachGroupPolicy(params).promise())
            .concatMap((value, index) => {
                return RX.Observable.empty()
            })
    }

    awsDetachGroupPolicy(groupname: string, policyArn: string): RX.Observable<{}> {
        var params: AWS.IAM.DetachGroupPolicyRequest = { PolicyArn: policyArn, GroupName: groupname }
        return RX.Observable.fromPromise(this.iamCli.attachGroupPolicy(params).promise())
            .concatMap((value, index) => {
                return RX.Observable.empty()
            })
    }

    awsListAttachedGroupPolicies(groupname: string, marker?: string): RX.Observable<string> {
        var params: AWS.IAM.ListAttachedGroupPoliciesRequest = { MaxItems: 1000, GroupName: groupname }
        if (marker) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listAttachedGroupPolicies(params).promise())
            .concatMap((value, index) => {
                if (!value.AttachedPolicies) {
                    return RX.Observable.from([])
                }
                var policies: string[] = []
                for (let attachedPolicy of value.AttachedPolicies) {
                    if (!attachedPolicy.PolicyArn) {
                        console.log(`${groupname} GroupPolicyAttachment doens't have ARN => ${attachedPolicy.PolicyName}(arn:${attachedPolicy.PolicyArn})`)
                        continue
                    }
                    policies.push(attachedPolicy.PolicyArn)
                }
                if (value.IsTruncated) {
                    return RX.Observable.from(policies)
                        .concat(this.awsListAttachedGroupPolicies(groupname, value.Marker))
                } else {
                    return RX.Observable.from(policies)
                }
            })

    }

    refreshUsers(): RX.Observable<Map<AWS.IAM.User, string[]>> {
        return this.awsListUsers()
            .concatMap((value: AWS.IAM.User, index) => {
                return RX.Observable.zip(
                    RX.Observable.of(value),
                    this.awsListAttachedUserPolicies(value.UserName),
                    (user: AWS.IAM.User, policies: string[]) => {
                        return new Map([[user, policies]])
                    }
                )
            })
    }

    refreshGroups(): RX.Observable<Map<AWS.IAM.Group, string[]>> {
        return this.awsListGroups()
            .concatMap((value: AWS.IAM.Group, index) => {
                return RX.Observable.zip(
                    RX.Observable.of(value),
                    this.awsListAttachedGroupPolicies(value.GroupName),
                    (group: AWS.IAM.Group, policies: string[]) => {
                        return new Map([[group, policies]])
                    }
                )
            })
    }

    refreshStore(): RX.Observable<boolean> {
        return RX.Observable.zip(
            this.refreshUsers(),
            this.refreshGroups(),
            (users, groups) => {
                return true
            }
        )
    }
}
