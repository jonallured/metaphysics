import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { Task, TaskType } from "./task"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AckTaskSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    task: {
      type: new GraphQLNonNull(TaskType),
      resolve: (response) => {
        return response
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "AckTaskFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(GravityMutationErrorType),
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AckTaskResponseOrError",
  types: [SuccessType, ErrorType],
  resolveType: (data) =>
    data._type === "GravityMutationError" ? ErrorType : SuccessType,
})

export const ackTaskMutation = mutationWithClientMutationId<
  Input,
  Task | null,
  ResolverContext
>({
  name: "AckTaskMutation",
  description: "Updates a Task on the logged in User",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    taskOrError: {
      type: new GraphQLNonNull(ResponseOrErrorType),
      description: "On success: the new state of the Task",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { meAckTaskLoader }) => {
    if (!meAckTaskLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const task: Task = await meAckTaskLoader?.(id)

      return { ...task, __typename: "SuccessType" }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        return {
          message: error.message,
          _type: "GravityMutationError",
        }
      }
    }
  },
})