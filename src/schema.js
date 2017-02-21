const immutable = require('immutable')
const graphqlTools = require('graphql-tools')
const {store, actions} = require('./actions')

const Mpn = `{
     manufacturer : String
     mpn          : String!
}`

const Sku = `{
    vendor : String!
    sku    : String!
}`

const schema = `
  type Mpn ${Mpn}
  input MpnInput ${Mpn}

  type Sku ${Sku}
  input SkuInput ${Sku}

  type Query {
    fromMpn(mpn: MpnInput!): Part
    fromSku(sku: SkuInput!): Part
  }

  type Part {
     mpn         : Mpn!
     image       : Image!
     datasheet   : String!
     description : String!
     skus        : [Sku]!
  }

  type Image {
    url           : String!
    credit_string : String!
    credit_url    : String!
  }
`

const resolverMap = {
  Query: {
    fromMpn(_, {mpn}) {
      return new Promise((resolve, reject) => {
        const reference = hash(mpn)
        const state = store.getState()
        const response = state.get('responses').get(reference)
        if (response) {
          return resolve(response.toJS())
        }
        const unsubscribe = store.subscribeChanges(['responses', reference], r => {
          if (r) {
            unsubscribe()
            resolve(r.toJS())
          }
        })
        const query = immutable.Map({
          mpn: mpn.mpn,
          manufacturer: mpn.manufacturer,
          time: Date.now(),
          reference,
        })
        actions.addQuery(query)
      })
    },
    fromSku(_, {sku}) {
      return
    },
  }
}

function hash(obj) {
  return String(immutable.Map(obj).hashCode())
}

module.exports = graphqlTools.makeExecutableSchema({
    typeDefs: schema,
    resolvers: resolverMap,
})
