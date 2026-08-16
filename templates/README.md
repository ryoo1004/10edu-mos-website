# Interactive Course Template

Use `interactive-course-template.html` to create new MOS course pages with the same layout as the current Word 365 Apps page.

## Placeholders

Replace these values before publishing:

| Placeholder | Meaning |
|---|---|
| `{{PAGE_TITLE}}` | Browser title without `- 10 Education` |
| `{{COURSE_TITLE}}` | Main hero heading |
| `{{COURSE_SUBTITLE}}` | Short instruction under heading |
| `{{PDF_URL}}` | Google Drive PDF link |
| `{{PDF_BUTTON_TEXT}}` | PDF button label |
| `{{PRACTICE_URL}}` | Practice file Google Drive link |
| `{{PRACTICE_BUTTON_TEXT}}` | Practice button label |
| `{{TASKS_JSON}}` | JavaScript array of task objects |

## TASKS Format

Each item in `{{TASKS_JSON}}` must use this shape:

```json
{
  "lesson": "Lesson 1",
  "task": 1,
  "tab": "TAB HOME",
  "tool": "General",
  "document": "Open the document and complete the following tasks:",
  "english": "Question text",
  "vietnamese": "Vietnamese explanation"
}
```

## Publishing Flow

1. Copy `templates/interactive-course-template.html` to a new long filename, for example `excel365-10edu-x7m2q9p4.html`.
2. Replace all placeholders.
3. Keep the filename hard to guess if the page is intended for enrolled learners only.
4. Do not link the page from `index.html` unless it should be public.
5. Verify the page renders and the `TASKS` array parses before committing.

## Notes

GitHub Pages is public hosting. Long filenames reduce casual guessing but are not real access control.

The template includes `js/highlighter.js`, which adds learner-side text highlighting with local browser storage. Highlights are saved per page, task, and field on the learner's device.
