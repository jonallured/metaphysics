import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { formatMarkdownValue } from "schema/v2/fields/markdown"
import Format, { FormatEnums } from "schema/v2/input_fields/format"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"
import {
  ARTIST_INSIGHT_KINDS,
  enrichWithArtistCareerHighlights,
  getArtistInsights,
  getAuctionRecord,
} from "./helpers"

export const ArtistInsightKind = new GraphQLEnumType({
  name: "ArtistInsightKind",
  values: ARTIST_INSIGHT_KINDS.reduce((acc, kind) => {
    return { ...acc, [kind]: { value: kind } }
  }, {}),
})

export const ArtistInsight = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistInsight",
  fields: () => ({
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of insight.",
      deprecationReason: "Use `kind` instead.",
    },
    label: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Label to use when displaying the insight.",
    },
    description: {
      type: GraphQLString,
      args: {
        format: {
          ...Format,
          defaultValue: FormatEnums.getValue("PLAIN")?.value,
        },
      },
      resolve: ({ description }, { format }) => {
        if (!description) return null
        return formatMarkdownValue(description, format).trim()
      },
    },
    entities: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      description: "List of entities relevant to the insight.",
    },
    count: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Number of entities relevant to the insight.",
    },
    kind: {
      type: ArtistInsightKind,
      description: "The type of insight.",
    },
    artist: {
      type: ArtistType,
    },
  }),
})

export const ArtistInsights: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ArtistInsight))),
  args: {
    kind: {
      type: new GraphQLList(ArtistInsightKind),
      description: "The specific insights to return.",
      defaultValue: ARTIST_INSIGHT_KINDS,
    },
  },
  resolve: async (
    artist,
    { kind },
    { auctionLotsLoader, artistCareerHighlightsLoader }
  ) => {
    if (kind.includes("HIGH_AUCTION_RECORD")) {
      const highAuctionRecord = await getAuctionRecord(
        artist,
        auctionLotsLoader
      )
      /* eslint-disable require-atomic-updates */
      artist.highAuctionRecord = highAuctionRecord
    }

    await enrichWithArtistCareerHighlights(
      kind,
      artist,
      artistCareerHighlightsLoader
    )

    const insights = getArtistInsights(artist)

    return insights.filter((insight) => kind.includes(insight.type))
  },
}
