import { GraphQLNonNull } from "graphql"
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

export const CommerceOptInResponseType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CommerceOptInResponse",
  fields: () => ({
    count: { type: GraphQLInt },
    ids: { type: GraphQLList(GraphQLString) },
  }),
})

interface Input {
  id: string
  exactPrice?: boolean
  pickupAvailable?: boolean
  framed?: boolean
  certificateOfAuthenticity?: boolean
  coaByGallery?: boolean
  coaByAuthenticatingBody?: boolean
}

const CommerceOptInSuccesssType = new GraphQLObjectType<any, ResolverContext>({
  name: "CommerceOptInSuccess",
  fields: () => ({
    updatedCommerceOptIn: {
      type: CommerceOptInResponseType,
      resolve: (result) => {
        return { count: result.success, ids: [] }
      },
    },
  }),
})

const CommerceOptInFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CommerceOptInFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const CommerceOptInMutationType = new GraphQLUnionType({
  name: "CommerceOptInMutationType",
  types: [CommerceOptInSuccesssType, CommerceOptInFailureType],
  resolveType: (object) => {
    if (object._type == "GravityMutationError") {
      return CommerceOptInFailureType
    }

    return CommerceOptInSuccesssType
  },
})

export const commerceOptInMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CommerceOptInMutation",
  description: "Opt all eligible artworks into BNMO",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    exactPrice: {
      type: GraphQLBoolean,
      description: "whether or not the artwork is set to exact price",
    },
    pickupAvailable: {
      type: GraphQLBoolean,
      description: "whether or not pick up it is pick up available",
    },
    framed: {
      type: GraphQLBoolean,
      description: "whether or not it is framed",
    },
    certificateOfAuthenticity: {
      type: GraphQLBoolean,
      description: "whether or not there is a CoA",
    },
    coaByGallery: {
      type: GraphQLBoolean,
      description: "whether or not the CoA is by the gallery",
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
      description: "whether or not the CoA is by an authenticating body",
    },
  },
  outputFields: {
    commerceOptInMutationOrError: {
      type: CommerceOptInMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      exactPrice,
      pickupAvailable,
      framed,
      certificateOfAuthenticity,
      coaByGallery,
      coaByAuthenticatingBody,
    },
    { optInArtworksIntoCommerceLoader }
  ) => {
    const gravityOptions = {
      exact_price: exactPrice,
      pickup_available: pickupAvailable,
      framed,
      certificate_of_authenticity: certificateOfAuthenticity,
      coa_by_gallery: coaByGallery,
      coa_by_authenticating_body: coaByAuthenticatingBody,
    }

    if (!optInArtworksIntoCommerceLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await optInArtworksIntoCommerceLoader(id, gravityOptions)
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})