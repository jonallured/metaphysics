import { getArtistInsights } from "../helpers"

describe("getArtistInsights", () => {
  it("returns an empty array when there are no insights", () => {
    const artist = {}
    const insights = getArtistInsights(artist)
    expect(insights).toEqual([])
  })

  describe("pipe delimited insight fields", () => {
    const value =
      "Art Institute of Chicago |Brooklyn Museum |       Hamburger Bahnhof"

    const fields = [
      {
        key: "solo_show_institutions",
        kind: "SOLO_SHOW",
        value,
      },
      {
        key: "group_show_institutions",
        kind: "GROUP_SHOW",
        value,
      },
      {
        key: "review_sources",
        kind: "REVIEWED",
        value,
      },
      {
        key: "biennials",
        kind: "BIENNIAL",
        value,
      },
    ]

    fields.forEach((field) => {
      it(`returns an array of ${field.key} entities split by pipe`, () => {
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(insight.count).toEqual(3)
        expect(insight.entities).toEqual([
          "Art Institute of Chicago",
          "Brooklyn Museum",
          "Hamburger Bahnhof",
        ])
      })
    })
  })

  describe("newline delimited insight fields", () => {
    const value =
      "Art Institute of Chicago \nBrooklyn Museum \n       Hamburger Bahnhof"

    const fields = [
      {
        key: "collections",
        kind: "COLLECTED",
        value,
      },
    ]

    fields.forEach((field) => {
      it(`returns an array of ${field.key} entities split by newline`, () => {
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(insight.count).toEqual(3)
        expect(insight.entities).toEqual([
          "Art Institute of Chicago",
          "Brooklyn Museum",
          "Hamburger Bahnhof",
        ])
      })
    })
  })

  describe("boolean insight fields", () => {
    const fields = [
      {
        key: "active_secondary_market",
        kind: "ACTIVE_SECONDARY_MARKET",
        value: true,
      },
    ]

    fields.forEach((field) => {
      it(`returns an empty array of entities when the ${field.key} value is true`, () => {
        field.value = true
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(insight.entities).toEqual([])
      })

      it(`returns an empty artist object when the ${field.key} value is false`, () => {
        field.value = false
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)
        expect(insight).toBeUndefined()
      })
    })
  })
})