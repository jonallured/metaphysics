import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { HomePageFairsModuleType } from "schema/v2/home/home_page_fairs_module"
import { connectionFromArray } from "graphql-relay"

export const FeaturedFairs: HomeViewSection = {
  id: "home-view-section-featured-fairs",
  type: HomeViewSectionTypeNames.HomeViewSectionFairs,
  contextModule: ContextModule.fairRail,
  component: {
    title: "Featured Fairs",
    description: "See Works in Top Art Fairs",
  },
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const { results: resolver } = HomePageFairsModuleType.getFields()

    if (!resolver?.resolve) {
      return []
    }

    const result = await resolver.resolve(parent, args, context, info)

    return connectionFromArray(result, args)
  }),
}