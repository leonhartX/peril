import {
  dangerRepresentationforPath,
  DangerRun,
  dangerRunForRules,
  dsl,
  dslTypeForEvent,
  feedback,
} from "../danger_run"

describe("for ping", () => {
  it("returns an action when ping is in the rules", () => {
    const rules = { ping: "dangerfile.js" }
    expect(dangerRunForRules("ping", null, rules)).toEqual([
      {
        action: null,
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: dsl.import,
        event: "ping",
        feedback: feedback.silent,
        repoSlug: undefined,
      },
    ])
  })

  it("returns nothing when ping is not in the rules", () => {
    const rules = {}
    expect(dangerRunForRules("ping", null, rules)).toEqual([])
  })
})

describe("for PRs", () => {
  it("returns a PR when PR is in the rules", () => {
    const rules = { pull_request: "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "created", rules)).toEqual([
      {
        action: "created",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: dsl.pr,
        event: "pull_request",
        feedback: feedback.commentable,
        repoSlug: undefined,
      },
    ])
  })

  // Same semantics
  it("returns a PR run when all sub events are globbed in the rules", () => {
    const rules = { "pull_request.*": "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "updated", rules)).toEqual([
      {
        action: "updated",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: dsl.pr,
        event: "pull_request",
        feedback: feedback.commentable,
        repoSlug: undefined,
      },
    ])
  })

  it("returns null when you only ask for a specific action", () => {
    const rules = { "pull_request.created": "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "updated", rules)).toEqual([])
  })

  it("returns a PR run when all sub events are globbed in the rules", () => {
    const rules = { "pull_request.deleted": "dangerfile.js" }
    expect(dangerRunForRules("pull_request", "deleted", rules)).toEqual([
      {
        action: "deleted",
        branch: "master",
        dangerfilePath: "dangerfile.js",
        dslType: dsl.pr,
        event: "pull_request",
        feedback: feedback.commentable,
        repoSlug: undefined,
      },
    ])
  })

  it("returns many runs when there are mutliple potential matches", () => {
    const rules = {
      issue: "dangerfile.js",
      pull_request: "dangerfile.js",
      "pull_request.*": "dangerfile.js",
      "pull_request.updated": "dangerfile.js",
    }
    expect(dangerRunForRules("pull_request", "updated", rules).length).toEqual(3)
  })
})

describe("dangerRepresentationforPath", () => {
  it("returns just the path with master and no repo with just a path", () => {
    const path = "dangerfile.ts"
    expect(dangerRepresentationforPath(path)).toEqual({
      branch: "master",
      dangerfilePath: "dangerfile.ts",
      repoSlug: undefined,
    })
  })

  it("returns the path and repo", () => {
    const path = "orta/eigen@dangerfile.ts"
    expect(dangerRepresentationforPath(path)).toEqual({
      branch: "master",
      dangerfilePath: "dangerfile.ts",
      repoSlug: "orta/eigen",
    })
  })

  it("returns just the path when there is no repo reference", () => {
    const path = "orta/eigen@dangerfile.ts#branch"
    expect(dangerRepresentationforPath(path)).toEqual({
      branch: "branch",
      dangerfilePath: "dangerfile.ts",
      repoSlug: "orta/eigen",
    })
  })

  it("handles a branch with no repo ref", () => {
    const path = "dangerfile.ts#branch"
    expect(dangerRepresentationforPath(path)).toEqual({
      branch: "branch",
      dangerfilePath: "dangerfile.ts",
      repoSlug: undefined,
    })
  })
})

describe("dslTypeForEvent", () => {
  it("recommends importing the integration as the DSL for anything but a PR", () => {
    expect(dslTypeForEvent("ping")).toEqual(dsl.import)
    expect(dslTypeForEvent("issue")).toEqual(dsl.import)
    expect(dslTypeForEvent("user")).toEqual(dsl.import)
  })

  it("recommends creating the Dangerfile DSL for a pull request", () => {
    expect(dslTypeForEvent("pull_request")).toEqual(dsl.pr)
  })
})
