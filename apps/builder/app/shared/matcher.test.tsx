import { describe, expect, test, vi } from "vitest";
import {
  $,
  renderTemplate,
  renderData,
  createProxy,
} from "@webstudio-is/template";
import { coreMetas } from "@webstudio-is/sdk";
import * as baseMetas from "@webstudio-is/sdk-components-react/metas";
import * as radixMetas from "@webstudio-is/sdk-components-react-radix/metas";
import type { Matcher, WsComponentMeta } from "@webstudio-is/sdk";
import {
  findClosestInstanceMatchingFragment,
  isTreeMatching,
  isInstanceDetachable,
  __testing__,
} from "./matcher";

const { isInstanceMatching } = __testing__;

const metas = new Map(Object.entries({ ...coreMetas, ...baseMetas }));
metas.set("ListItem", {
  ...baseMetas.ListItem,
  constraints: {
    relation: "parent",
    component: { $eq: "List" },
  },
});

metas.set("NoTextItem", {
  ...baseMetas.Box,
  constraints: {
    relation: "child",
    text: false,
  },
});

// Solutions added as a quick workaround
describe("Fast workaround tests", () => {
  // For simplicity, we don’t check the relation=child and text=false constraints during tree validation.
  // These are only used to prevent text editing of container components.
  test("Child text=false constraints does not affect matching", () => {
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.NoTextItem ws:id="notextitem">AnyText</$.NoTextItem>
          </$.Body>
        ),
        metas,
        instanceSelector: ["notextitem", "body"],
      })
    ).toBeTruthy();
  });
});

describe("is instance matching", () => {
  test("matches self with self matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "self",
          component: { $eq: "ListItem" },
        },
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "self",
          component: { $in: ["ListItem", "ListBox"] },
        },
      })
    ).toBeTruthy();
  });

  test("matches self with negated self matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "self",
          component: { $neq: "Box" },
        },
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "self",
          component: { $nin: ["Box", "List"] },
        },
      })
    ).toBeTruthy();
  });

  test("matches parent with parent matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "parent",
          component: { $eq: "List" },
        },
      })
    ).toBeTruthy();
  });

  test("not matches ancestor with parent matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box">
                <$.ListItem ws:id="listitem"></$.ListItem>
              </$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "box", "list", "body"],
        query: {
          relation: "parent",
          component: { $eq: "List" },
        },
      })
    ).toBeFalsy();
  });

  test("not matches another parent with parent matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.ListItem ws:id="listitem"></$.ListItem>
          </$.Body>
        ),
        instanceSelector: ["listitem", "body"],
        query: {
          relation: "parent",
          component: { $eq: "List" },
        },
      })
    ).toBeFalsy();
  });

  test("matches parent with negated parent matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.ListItem ws:id="listitem"></$.ListItem>
          </$.Body>
        ),
        instanceSelector: ["listitem", "body"],
        query: {
          relation: "parent",
          component: { $neq: "List" },
        },
      })
    ).toBeTruthy();
  });

  test("not matches parent with negated parent matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "parent",
          component: { $neq: "List" },
        },
      })
    ).toBeFalsy();
  });

  test("matches parent with ancestor matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "ancestor",
          component: { $eq: "List" },
        },
      })
    ).toBeTruthy();
  });

  test("matches parent with ancestor matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box">
                <$.ListItem ws:id="listitem"></$.ListItem>
              </$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "box", "list", "body"],
        query: {
          relation: "ancestor",
          component: { $eq: "List" },
        },
      })
    ).toBeTruthy();
  });

  test("not matches another ancestor with ancestor matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.Box ws:id="box">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.Box>
          </$.Body>
        ),
        instanceSelector: ["listitem", "box", "body"],
        query: {
          relation: "ancestor",
          component: { $eq: "List" },
        },
      })
    ).toBeFalsy();
  });

  test("matches ancestor with negated ancestor matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.Box ws:id="box">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.Box>
          </$.Body>
        ),
        instanceSelector: ["listitem", "box", "body"],
        query: {
          relation: "ancestor",
          component: { $neq: "List" },
        },
      })
    ).toBeTruthy();
  });

  test("not matches ancestor with negated ancestor matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: {
          relation: "ancestor",
          component: { $neq: "List" },
        },
      })
    ).toBeFalsy();
  });

  test("combines self, parent and ancestor matchers", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["listitem", "list", "body"],
        query: [
          {
            relation: "self",
            component: { $eq: "ListItem" },
          },
          {
            relation: "parent",
            component: { $eq: "List" },
          },
          {
            relation: "ancestor",
            component: { $eq: "Body" },
          },
        ],
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.Box ws:id="box">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.Box>
          </$.Body>
        ),
        instanceSelector: ["listitem", "box", "body"],
        query: [
          {
            relation: "self",
            component: { $eq: "ListItem" },
          },
          {
            relation: "parent",
            component: { $eq: "List" },
          },
          {
            relation: "ancestor",
            component: { $eq: "Body" },
          },
        ],
      })
    ).toBeFalsy();
  });

  test("negated ancestor matcher should not interfere with self relation", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list"></$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "ancestor",
          component: { $neq: "List" },
        },
      })
    ).toBeTruthy();
  });

  test("combines multiple ancestor matchers", () => {
    const query: Matcher[] = [
      {
        relation: "ancestor",
        component: { $eq: "Body" },
      },
      {
        relation: "ancestor",
        component: { $in: ["Box"] },
      },
    ];
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.Box ws:id="box">
              <$.List ws:id="list"></$.List>
            </$.Box>
          </$.Body>
        ),
        instanceSelector: ["list", "box", "body"],
        query,
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list"></$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query,
      })
    ).toBeFalsy();
  });

  test("matches a child with child matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "child",
          component: { $eq: "ListItem" },
        },
      })
    ).toBeTruthy();
  });

  test("matches a child with negated child matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list"></$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "child",
          component: { $neq: "ListItem" },
        },
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box"></$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "child",
          component: { $neq: "ListItem" },
        },
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "child",
          component: { $neq: "ListItem" },
        },
      })
    ).toBeFalsy();
  });

  test("not matches a parent without a child with child matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list"></$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "child",
          component: { $eq: "ListItem" },
        },
      })
    ).toBeFalsy();
  });

  test("not matches a parent with different child with child matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box"></$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "child",
          component: { $eq: "ListItem" },
        },
      })
    ).toBeFalsy();
  });

  test("matches a child with descendant matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "descendant",
          component: { $eq: "ListItem" },
        },
      })
    ).toBeTruthy();
  });

  test("matches a descendant with descendant matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box">
                <$.ListItem ws:id="listitem"></$.ListItem>
              </$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "descendant",
          component: { $eq: "ListItem" },
        },
      })
    ).toBeTruthy();
  });

  test("matches a descendant with negated descendant matcher", () => {
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box"></$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "descendant",
          component: { $neq: "ListItem" },
        },
      })
    ).toBeTruthy();
    expect(
      isInstanceMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.Box ws:id="box">
                <$.ListItem ws:id="listitem"></$.ListItem>
              </$.Box>
            </$.List>
          </$.Body>
        ),
        instanceSelector: ["list", "body"],
        query: {
          relation: "descendant",
          component: { $neq: "ListItem" },
        },
      })
    ).toBeFalsy();
  });

  test("provide error message when negated matcher is failed", () => {
    const onError = vi.fn();
    isInstanceMatching({
      ...renderData(
        <$.Body ws:id="body">
          <$.Box ws:id="box"></$.Box>
        </$.Body>
      ),
      instanceSelector: ["box", "body"],
      query: {
        relation: "self",
        component: { $nin: ["Box", "Text"] },
      },
      onError,
    });
    expect(onError).toHaveBeenLastCalledWith("Box or Text is not acceptable");
    isInstanceMatching({
      ...renderData(
        <$.Body ws:id="body">
          <$.Box ws:id="box">
            <$.ListItem ws:id="listitem"></$.ListItem>
          </$.Box>
        </$.Body>
      ),
      instanceSelector: ["listitem", "box", "body"],
      query: {
        relation: "ancestor",
        component: { $nin: ["Box", "Text"] },
      },
      onError,
    });
    expect(onError).toHaveBeenLastCalledWith("Box or Text is not acceptable");
  });

  test("provide error message when positive matcher is failed", () => {
    const onError = vi.fn();
    isInstanceMatching({
      ...renderData(
        <$.Body ws:id="body">
          <$.ListItem ws:id="listitem"></$.ListItem>
        </$.Body>
      ),
      instanceSelector: ["box", "body"],
      query: {
        relation: "self",
        component: { $in: ["Box", "Text"] },
      },
      onError,
    });
    expect(onError).toHaveBeenLastCalledWith("Box or Text is missing");
    isInstanceMatching({
      ...renderData(
        <$.Body ws:id="body">
          <$.ListItem ws:id="listitem"></$.ListItem>
        </$.Body>
      ),
      instanceSelector: ["box", "body"],
      query: {
        relation: "ancestor",
        component: { $in: ["Box", "Text"] },
      },
      onError,
    });
    expect(onError).toHaveBeenLastCalledWith("Box or Text is missing");
  });
});

describe("is tree matching", () => {
  const metas = new Map<string, WsComponentMeta>([
    [
      "ListItem",
      {
        type: "container",
        icon: "",
        constraints: {
          relation: "parent",
          component: { $eq: "List" },
        },
      },
    ],
    [
      "Tabs",
      {
        type: "container",
        icon: "",
        constraints: {
          relation: "descendant",
          component: { $eq: "TabsTrigger" },
        },
      },
    ],
  ]);

  test("match selected instance", () => {
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        metas,
        instanceSelector: ["listitem", "list", "body"],
      })
    ).toBeTruthy();
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.ListItem ws:id="listitem"></$.ListItem>
          </$.Body>
        ),
        metas,
        instanceSelector: ["listitem", "body"],
      })
    ).toBeFalsy();
  });

  test("match all descendants", () => {
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.List ws:id="list">
              <$.ListItem ws:id="listitem"></$.ListItem>
            </$.List>
          </$.Body>
        ),
        metas,
        instanceSelector: ["list", "body"],
      })
    ).toBeTruthy();
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.ListItem ws:id="listitem"></$.ListItem>
            <$.Box ws:id="box"></$.Box>
          </$.Body>
        ),
        metas,
        instanceSelector: ["body"],
      })
    ).toBeFalsy();
  });

  test("match ancestors", () => {
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.Tabs ws:id="tabs">
              <$.Box ws:id="box">
                <$.TabsTrigger ws:id="trigger"></$.TabsTrigger>
              </$.Box>
            </$.Tabs>
          </$.Body>
        ),
        metas,
        instanceSelector: ["trigger", "box", "tabs", "body"],
      })
    ).toBeTruthy();
    expect(
      isTreeMatching({
        ...renderData(
          <$.Body ws:id="body">
            <$.Tabs ws:id="tabs">
              <$.Box ws:id="box"></$.Box>
            </$.Tabs>
          </$.Body>
        ),
        metas,
        instanceSelector: ["box", "tabs", "body"],
      })
    ).toBeFalsy();
  });
});

describe("is instance detachable", () => {
  const metas = new Map(Object.entries(baseMetas));
  const radix = createProxy("@webstudio-is/sdk-components-react-radix:");
  for (const [component, meta] of Object.entries(radixMetas)) {
    metas.set(`@webstudio-is/sdk-components-react-radix:${component}`, meta);
  }

  test("allow deleting one of matching instances", () => {
    expect(
      isInstanceDetachable({
        ...renderData(
          <$.Body ws:id="body">
            <radix.Tabs ws:id="tabs">
              <radix.TabsList ws:id="list">
                <radix.TabsTrigger ws:id="trigger1"></radix.TabsTrigger>
                <radix.TabsTrigger ws:id="trigger2"></radix.TabsTrigger>
              </radix.TabsList>
              <radix.TabsContent ws:id="content1"></radix.TabsContent>
              <radix.TabsContent ws:id="content2"></radix.TabsContent>
            </radix.Tabs>
          </$.Body>
        ),
        metas,
        instanceSelector: ["trigger1", "list", "tabs", "body"],
      })
    ).toBeTruthy();
  });

  test("prevent deleting last matching instance", () => {
    expect(
      isInstanceDetachable({
        ...renderData(
          <$.Body ws:id="body">
            <radix.Tabs ws:id="tabs">
              <radix.TabsList ws:id="list">
                <radix.TabsTrigger ws:id="trigger1"></radix.TabsTrigger>
              </radix.TabsList>
              <radix.TabsContent ws:id="content1"></radix.TabsContent>
            </radix.Tabs>
          </$.Body>
        ),
        metas,
        instanceSelector: ["trigger1", "list", "tabs", "body"],
      })
    ).toBeFalsy();
  });

  test("allow deleting when siblings not matching", () => {
    expect(
      isInstanceDetachable({
        ...renderData(
          <$.Body ws:id="body">
            <radix.Tabs ws:id="tabs"></radix.Tabs>
            <$.Box ws:id="box"></$.Box>
          </$.Body>
        ),
        metas,
        instanceSelector: ["box", "body"],
      })
    ).toBeTruthy();
  });
});

describe("find closest instance matching fragment", () => {
  test("finds closest list with list item fragment", () => {
    const { instances, props } = renderData(
      <$.Body ws:id="body">
        <$.List ws:id="list">
          <$.ListItem ws:id="listitem"></$.ListItem>
        </$.List>
      </$.Body>
    );
    const fragment = renderTemplate(<$.ListItem ws:id="new"></$.ListItem>);
    expect(
      findClosestInstanceMatchingFragment({
        metas,
        instances,
        props,
        instanceSelector: ["list", "body"],
        fragment,
      })
    ).toEqual(0);
    expect(
      findClosestInstanceMatchingFragment({
        metas,
        instances,
        props,
        // looks up until list parent is reached
        instanceSelector: ["listitem", "list", "body"],
        fragment,
      })
    ).toEqual(1);
    expect(
      findClosestInstanceMatchingFragment({
        metas,
        instances,
        props,
        instanceSelector: ["body"],
        fragment,
      })
    ).toEqual(-1);
  });

  test("finds button parent with button fragment", () => {
    const { instances, props } = renderData(
      <$.Body ws:id="body">
        <$.Button ws:id="button"></$.Button>
      </$.Body>
    );
    const fragment = renderTemplate(<$.Button ws:id="new"></$.Button>);
    expect(
      findClosestInstanceMatchingFragment({
        metas,
        instances,
        props,
        instanceSelector: ["button", "body"],
        fragment,
      })
    ).toEqual(1);
  });

  test("finds button parent with button+span fragment", () => {
    const { instances, props } = renderData(
      <$.Body ws:id="body">
        <$.Button ws:id="button"></$.Button>
      </$.Body>
    );
    const fragment = renderTemplate(
      <>
        <$.Button ws:id="new-button"></$.Button>
        <$.Text ws:id="new-text"></$.Text>
      </>
    );
    expect(
      findClosestInstanceMatchingFragment({
        metas,
        instances,
        props,
        instanceSelector: ["button", "body"],
        fragment,
      })
    ).toEqual(1);
  });

  test("report first error", () => {
    const onError = vi.fn();
    const { instances, props } = renderData(<$.Body ws:id="body"></$.Body>);
    const fragment = renderTemplate(<$.ListItem ws:id="listitem"></$.ListItem>);
    findClosestInstanceMatchingFragment({
      metas,
      instances,
      props,
      instanceSelector: ["body"],
      fragment,
      onError,
    });
    expect(onError).toHaveBeenLastCalledWith("List is missing");
  });
});
