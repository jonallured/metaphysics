import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("LatestArticles", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-latest-articles") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              description
              behaviors {
                viewAll {
                  buttonText
                  href
                  ownerType
                }
              }
            }
          }
        }
      }
    `

    const context = {}

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      Object {
        "__typename": "HomeViewSectionArticles",
        "component": Object {
          "behaviors": Object {
            "viewAll": Object {
              "buttonText": null,
              "href": "/articles",
              "ownerType": "articles",
            },
          },
          "description": null,
          "title": "Artsy Editorial",
        },
        "contextModule": "articleRail",
        "internalID": "home-view-section-latest-articles",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-latest-articles") {
            ... on HomeViewSectionArticles {
              articlesConnection(first: 3) {
                edges {
                  node {
                    slug
                  }
                }
              }
            }
          }
        }
      }
    `

    const articles = [
      {
        title: "Bored apes stolen",
        slug: "stolen-apes",
      },
      {
        title: "More apes stolen",
        slug: "more-apes",
      },
    ]

    const articlesLoader = jest.fn(async () => ({
      count: articles.length,
      results: articles,
    }))

    const context: any = {
      articlesLoader,
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      Object {
        "articlesConnection": Object {
          "edges": Array [
            Object {
              "node": Object {
                "slug": "stolen-apes",
              },
            },
            Object {
              "node": Object {
                "slug": "more-apes",
              },
            },
          ],
        },
      }
    `)
  })
})