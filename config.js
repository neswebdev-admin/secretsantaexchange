// =====================================================================
//  EDIT THIS FILE to set up your exchange.
//  Replace the placeholder names with real ones. Every name must be unique.
//  role: "parent" | "child" | "solo"   (solo = grandparent / single person)
// =====================================================================
window.EXCHANGE_CONFIG = {
  title: "Family Gift Exchange",
  year: 2026,

  // Optional extras shown on every family's page (leave "" to hide)
  budget: "$25 – $50",
  exchangeDate: "Christmas Eve",

  groups: [
    {
      id: "family-a",
      name: "Family A",
      members: [
        { name: "A Mom",  role: "parent" },
        { name: "A Dad",  role: "parent" },
        { name: "A Son 1", role: "child" },
        { name: "A Son 2", role: "child" },
      ],
    },
    {
      id: "family-b",
      name: "Family B",
      members: [
        { name: "B Mom",      role: "parent" },
        { name: "B Dad",      role: "parent" },
        { name: "B Daughter", role: "child" },
        { name: "B Son",      role: "child" },
      ],
    },
    {
      id: "family-c",
      name: "Family C",
      members: [
        { name: "C Mom",        role: "parent" },
        { name: "C Dad",        role: "parent" },
        { name: "C Daughter 1", role: "child" },
        { name: "C Daughter 2", role: "child" },
        { name: "C Son",        role: "child" },
        { name: "C Daughter 3", role: "child" },
        { name: "C Daughter 4", role: "child" },
      ],
    },
    {
      id: "grandparent",
      name: "Grandparent",
      members: [{ name: "Grandma", role: "solo" }],
    },
  ],

  // ---------------------------------------------------------------
  //  Rules. These two are ALWAYS enforced:
  //    • nobody draws themselves
  //    • a child never draws their own parent
  //    • a parent never draws their spouse
  //  The switches below add optional extra rules.
  // ---------------------------------------------------------------
  rules: {
    // Two people never draw each other (A has B and B has A).
    noMutualPairs: true,
    // A parent can't draw their own child. (Because the whole family
    // shares one link, this helps keep the kids' gifts a surprise.)
    noParentDrawsOwnChild: false,
    // Brothers and sisters can't draw each other.
    noSiblings: false,
  },
};
