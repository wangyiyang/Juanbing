import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the admin entry for 卷饼", () => {
    render(createElement(HomePage));

    expect(
      screen.getByRole("heading", { name: "卷饼问卷平台" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入管理台" })).toHaveAttribute(
      "href",
      "/surveys",
    );
  });
});
