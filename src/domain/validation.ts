import { validationPolicies } from "./policies";
import type { ProjectData, ValidationIssue } from "./types";

export function validateProject(project: ProjectData): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];

  validationPolicies.flatMap((policy) => policy(project)).forEach((issue) => {
    const key = [
      issue.code,
      issue.message,
      issue.relatedComponents?.join(",") ?? "",
      issue.relatedWires?.join(",") ?? ""
    ].join("|");

    if (!seen.has(key)) {
      seen.add(key);
      issues.push(issue);
    }
  });

  return issues.sort((a, b) => {
    if (a.severity === b.severity) {
      return a.code.localeCompare(b.code);
    }
    return a.severity === "error" ? -1 : 1;
  });
}
