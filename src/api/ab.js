import burnApolloClient from "./ceshi";
import gql from 'graphql-tag'

export function getBurnLogs(params) {
    console.log(params)
    return burnApolloClient.query({
        query: gql`query ($first: Int!,$skip: Int!) {
            logs(first: $first, skip: $skip) {
                id
                from
                token
                mid
                amount
                timestamp
            }
        }`,
        variables: params
    })
}