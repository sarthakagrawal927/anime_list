import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { FieldOptions, FilterActions, SearchFilter } from "@/lib/types";

import FilterRow from "../FilterRow";

const fields: FieldOptions = {
  numeric: ["score", "year"],
  array: ["genres", "themes", "demographics"],
  string: ["title", "type", "season"],
};

const actions: FilterActions = {
  comparison: [
    "EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUALS",
    "LESS_THAN",
    "LESS_THAN_OR_EQUALS",
  ],
  array: ["INCLUDES_ALL", "INCLUDES_ANY", "EXCLUDES"],
};

describe("FilterRow", () => {
  it("switches type filters to a single-value enum action", () => {
    const onChange = jest.fn();
    const filter: SearchFilter = {
      field: "score",
      action: "GREATER_THAN_OR_EQUALS",
      value: 7,
    };

    render(
      <FilterRow
        filter={filter}
        index={0}
        fields={fields}
        actions={actions}
        onChange={onChange}
        onRemove={jest.fn()}
      />
    );

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "type" },
    });

    expect(onChange).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        field: "type",
        action: "EQUALS",
        value: "",
      })
    );
  });

  it("normalizes legacy type filters before sending updates", () => {
    const onChange = jest.fn();
    const filter: SearchFilter = {
      field: "type",
      action: "INCLUDES_ANY",
      value: ["TV"],
    };

    render(
      <FilterRow
        filter={filter}
        index={1}
        fields={fields}
        actions={actions}
        onChange={onChange}
        onRemove={jest.fn()}
      />
    );

    fireEvent.change(screen.getAllByRole("combobox")[2], {
      target: { value: "Movie" },
    });

    expect(onChange).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        field: "type",
        action: "EQUALS",
        value: "Movie",
      })
    );
  });
});
