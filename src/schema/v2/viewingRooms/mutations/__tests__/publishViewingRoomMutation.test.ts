import config from "config"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("publishViewingRoomMutation", () => {
  const mockUpdateViewingRoomLoader = jest.fn()

  const context = {
    updateViewingRoomLoader: mockUpdateViewingRoomLoader,
  }

  const viewingRoomData = {
    id: "viewing-room-id",
  }

  beforeAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = true
  })

  afterAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = false
  })

  beforeEach(() => {
    mockUpdateViewingRoomLoader.mockResolvedValue(
      Promise.resolve(viewingRoomData)
    )
  })

  afterEach(() => {
    mockUpdateViewingRoomLoader.mockReset()
  })

  const mutation = gql`
    mutation {
      publishViewingRoom(input: { viewingRoomID: "viewing-room-id" }) {
        __typename
      }
    }
  `

  it("correctly calls the updateViewingRoomLoader", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateViewingRoomLoader).toHaveBeenCalledWith(
      "viewing-room-id",
      {
        published: true,
      }
    )
  })
})