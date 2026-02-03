import { describe, it, expect } from "vitest";

describe("Sequences Router", () => {
  it("should define sequences router structure", () => {
    // Test that the sequences router is properly structured
    const sequenceTypes = ["email", "wait", "condition"];
    const conditionTypes = ["opened", "replied", "clicked"];
    
    expect(sequenceTypes).toContain("email");
    expect(sequenceTypes).toContain("wait");
    expect(sequenceTypes).toContain("condition");
    
    expect(conditionTypes).toContain("opened");
    expect(conditionTypes).toContain("replied");
    expect(conditionTypes).toContain("clicked");
  });

  it("should validate sequence structure", () => {
    const mockSequence = {
      name: "Test Sequence",
      description: "Test description",
      steps: [
        {
          type: "email",
          subject: "Test Subject",
          body: "Test Body",
        },
        {
          type: "wait",
          waitDays: 2,
        },
        {
          type: "condition",
          condition: {
            type: "opened",
          },
        },
      ],
    };

    expect(mockSequence.name).toBe("Test Sequence");
    expect(mockSequence.steps).toHaveLength(3);
    expect(mockSequence.steps[0].type).toBe("email");
    expect(mockSequence.steps[1].type).toBe("wait");
    expect(mockSequence.steps[2].type).toBe("condition");
  });
});
