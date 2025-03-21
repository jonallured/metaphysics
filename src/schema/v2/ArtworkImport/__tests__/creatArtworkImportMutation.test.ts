import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportMutation", () => {
  it("creates an artwork import successfully", async () => {
    const createArtworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      file_name: "import.csv",
    })

    const mutation = gql`
      mutation {
        createArtworkImport(
          input: {
            partnerID: "partner-1"
            s3Key: "/some/path/uuid.csv"
            s3Bucket: "someBucket"
            fileName: "import.csv"
          }
        ) {
          artworkImportOrError {
            ... on CreateArtworkImportSuccess {
              artworkImport {
                internalID
                fileName
              }
            }
          }
        }
      }
    `

    const context = { createArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(createArtworkImportLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      s3_key: "/some/path/uuid.csv",
      s3_bucket: "someBucket",
      file_name: "import.csv",
    })

    expect(result).toEqual({
      createArtworkImport: {
        artworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            fileName: "import.csv",
          },
        },
      },
    })
  })
})
