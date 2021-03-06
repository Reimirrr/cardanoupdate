const assert = require("assert");

const { waitForPageLoad, callMethod, clickUntil } = require("../../uiTestUtils");

const baseUrl = "http://localhost:3000";

describe("Communities page", function() {
  before(() => {
    browser.url(`${baseUrl}/`);
    waitForPageLoad(browser, `/`);

    callMethod(browser, "generateTestUser");

    browser.executeAsync(done =>
      Meteor.loginWithPassword("testing", "testing", done)
    );
  });

  it("user can add a new community", function() {
    browser.url(`${baseUrl}/community`);
    browser.waitForEnabled("#add-Resource"); // Communities page loaded

    browser.click("#add-Resource");

    browser.waitUntil(() => browser.getUrl().endsWith("community/new"));
    waitForPageLoad(browser, "/community/new");

    browser.click(".add-socialResource");
    browser.waitForText("#NameError");
    assert.equal(browser.getText("#NameError"), "Name is required");
    browser.waitForText("#descriptionError");
    assert.equal(
      browser.getText("#descriptionError"),
      "Description is required"
    );

    browser.setValue("input#Name", "Name Test");
    browser.waitUntil(
      () => browser.getText("#NameError") !== "Name is required"
    );

    browser.setValue("textarea#description", "Description Test");
    browser.waitUntil(
      () => browser.getText("#descriptionError") !== "Description is required"
    );

    browser.click(".add-socialResource");
    browser.waitUntil(() => browser.getUrl().endsWith("community"));
  });

  it("new resource appears in list", () => {
    browser.url(`${baseUrl}/community`);
    waitForPageLoad(browser, "/community");
    
    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for list appearance test",
      description: "Test description for list test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }]
    });

    browser.waitForExist(`a[href="/community/${newResourceId}"]`);
    assert.equal(
      browser.getText(`a[href="/community/${newResourceId}"]`).toLowerCase(),
      "Test Name For List Appearance Test".toLowerCase()
    );

    const card = browser
      .element(`a[href="/community/${newResourceId}"]`)
      .$("..")
      .$("..");
    assert.equal(
      card.$(".card-text").getText(),
      "Test description for list test"
    );
    assert.equal(
      card.$(".card-link").getAttribute("href"),
      "https://twitter.com/hashtag/TestTwitterUrl"
    );
    assert(
      card
        .$(".card-link i")
        .getAttribute("class")
        .includes("fa-twitter"),
      "Wrong class on card-link"
    );
  });
  
  it("users can translate a community", () => {
    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for view appearance test",
      description: "Test description for view test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }]
    });

    browser.url(`${baseUrl}/community/${newResourceId}`);
    waitForPageLoad(browser, `/community/${newResourceId}`);

    const href = browser.getAttribute(".translate-link", "href");
    browser.click(".translate-link");
    waitForPageLoad(browser, href);

    browser.setValue("input#Name", "Name Test SR");

    clickUntil(browser, '.add-socialResource', () => browser.getUrl().endsWith('/community'));
  });

  it("users can view different translations of a community", () => {
    const origResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for translation view test",
      description: "Test description for translation view test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }]
    });

    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for translation view test SR",
      description: "Test description for translation view test SR",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'sr',
      original: origResourceId,
      tags: [{ name: "testTag" }]
    });

    browser.url(`${baseUrl}/community`);
    waitForPageLoad(browser, "/community");

    const card = browser
        .element(`a[href="/community/${origResourceId}"]`)
        .$("..")
        .$("..");
    card.click(".flagItem > i");

    // Testing to see if this is actually in the list
    card.waitForEnabled(`a[href="/community/${newResourceId}"]`);
    card.click(`a[href="/community/${newResourceId}"]`);

    waitForPageLoad(browser, `/community/${newResourceId}`);

    assert.equal(browser.getText('h1.card-title'), 'Test Name for translation view test SR');
/*
    browser.click(".flagItem > i");

    // Testing to see if this is actually in the list
    card.waitForEnabled(`a[href="/community/${origResourceId}"]`);
    card.click(`a[href="/community/${origResourceId}"]`);

    waitForPageLoad(browser, `/community/${origResourceId}`);*/
  });

  it("users can view social resources", () => {
    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for view appearance test",
      description: "Test description for view test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }],
    });

    browser.url(`${baseUrl}/community/${newResourceId}`);
    waitForPageLoad(browser, `/community/${newResourceId}`);

    assert.equal(
      browser.getText("h1.card-title").toLowerCase(),
      "Test Name for view appearance test".toLowerCase()
    );
    assert.equal(
      browser.getText(".news-body"),
      "Test description for view test"
    );

    const tagLinks = browser.elements('a[href^="/tags"]');
    assert.equal(tagLinks.value.length, 1);
    assert.equal(tagLinks.value[0].getText(), "testTag");
    assert(
      tagLinks.value[0].getAttribute("href").endsWith("/tags?search=testTag")
    );

    const externalLinks = browser.elements("a.btn.website");
    assert.equal(externalLinks.value.length, 1);
    assert(
      externalLinks.value[0]
        .$("i")
        .getAttribute("class")
        .includes("fa-twitter")
    );
    assert.equal(
      externalLinks.value[0].getAttribute("href"),
      "https://twitter.com/hashtag/TestTwitterUrl"
    );
  });

  it("user can edit a warning he/she created", () => {
    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for edit test",
      description: "Test description for edit test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }]
    });

    browser.url(`${baseUrl}/community`);
    waitForPageLoad(browser, `/community`);

    const card = browser
      .element(`a[href="/community/${newResourceId}"]`)
      .$("..")
      .$("..");

    card.$(".flagItem i").click();
    card.waitForVisible(".flagItem #js-edit");
    card.$(".flagItem #js-edit").click();

    waitForPageLoad(browser, `/community/${newResourceId}/edit`);

    browser.setValue("input#Name", "Name Test after edits");
    browser.setValue("input#Resource_url", "https://gitter.im/meteor/meteor");
    browser.setValue("textarea#description", "Description Test after editing");

    browser.click(".add-socialResource");
    browser.waitUntil(() => browser.getUrl().endsWith("community"));

    const cardAfterEdit = browser
      .element(`a[href="/community/${newResourceId}"]`)
      .$("..")
      .$("..");
    assert.equal(
      cardAfterEdit
        .$(".card-title")
        .getText()
        .toLowerCase(),
      "Name Test after edits".toLowerCase()
    );
    assert.equal(
      cardAfterEdit.$(".card-text").getText(),
      "Description Test after editing"
    );
    assert.equal(
      cardAfterEdit.$(".card-link").getAttribute("href"),
      "https://gitter.im/meteor/meteor"
    );
    assert(
      cardAfterEdit
        .$(".card-link i")
        .getAttribute("class")
        .includes("fa-gitter"),
      "Wrong class on card-link"
    );
  });

  it("user can post comments", () => {
    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for edit test",
      description: "Test description for edit test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }]
    });

    browser.url(`${baseUrl}/community/${newResourceId}`);
    waitForPageLoad(browser, `/community/${newResourceId}`);

    const commentAreas = browser.elements(".comment-area").value;

    for (const elem of commentAreas) {
      elem.$("textarea.comment-text").setValue("test comment Lorem Ipsum");
      elem.$(".save-comment").click();

      elem.waitUntil(() => {
        const cardTexts = elem.elements(".card-text").value;
        return cardTexts.find(a => a.getText() === "test comment Lorem Ipsum");
      });
    }
  });

  it("user can remove a community he/she created", () => {
    const newResourceId = callMethod(browser, "addSocialResource", {
      Name: "Test Name for removal",
      description: "Test description for removal",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      language: 'en',
      tags: [{ name: "testTag" }]
    });

    browser.url(`${baseUrl}/community`);
    waitForPageLoad(browser, `/community`);

    const card = browser
      .element(`a[href="/community/${newResourceId}"]`)
      .$("..")
      .$("..");

    card.$(".flagItem i").click();
    card.waitForVisible(".flagItem #js-remove");
    card.$(".flagItem #js-remove").click();

    browser.waitForEnabled(".swal2-confirm");
    browser.click(".swal2-confirm");

    browser.waitUntil(() => {
      return (
        browser.$(`a[href="/community/${newResourceId}"]`).type ===
        "NoSuchElement"
      );
    });
  });

  it("user can flag a community others created", () => {
    const newResourceId = callMethod(browser, "addTestSocialResource", {
      Name: "Test Name for edit test",
      description: "Test description for edit test",
      Resource_url: "https://twitter.com/hashtag/TestTwitterUrl",
      tags: [{ name: "testTag" }]
    });

    browser.url(`${baseUrl}/community`);
    waitForPageLoad(browser, `/community`);

    const card = browser
      .element(`a[href="/community/${newResourceId}"]`)
      .$("..")
      .$("..");

    card.click(".flagItem i");
    card.waitForVisible(".flagItem .flag-socialResource");
    card.$(".flagItem .flag-socialResource").click();

    browser.waitForEnabled(".swal2-content .btn#spam");
    browser.click(".swal2-content .btn#spam");

    browser.waitUntil(() => !browser.isVisible(".swal2-content"));
    browser.waitUntil(() =>
      browser.getText(".noty_body").startsWith("Successfully flagged.")
    );
  });
});
