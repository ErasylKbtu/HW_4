// Example assignments. Dates are relative only when a new database is created.
export function makeSeedTasks() {
  const today = new Date();
  function dateIn(days) {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  const examples = [
    ['task-react', 'Build an async React app', 'React Development', 'Course instructor', 2, 'High', 'In progress', 5,
      'Build a responsive assignment planner with a simulated API. Load data with Effects and keep the interface correct when requests finish in a different order.',
      'Prepare a short demo of cleanup, race conditions and stale closures. Submit both the repository and deployment links.'],
    ['task-design', 'Map the customer journey', 'UX Research', 'Seminar instructor', 4, 'Medium', 'To do', 3,
      'Turn interview findings into a clear customer journey. Include user goals, pain points and opportunities at each stage.',
      'Use the MedReminder interview notes. Keep findings separate from assumptions.'],
    ['task-data', 'Explore shopping trends', 'Data Science', 'Lab instructor', 5, 'High', 'In progress', 4,
      'Compare purchase patterns using grouped tables, a pivot table and four clear visualizations. Explain the conclusions in the notebook.',
      'Check missing values and label every axis before exporting the report.'],
    ['task-ios', 'Practice Swift optionals', 'iOS Development', 'Lab instructor', 7, 'Medium', 'To do', 2,
      'Complete the station simulation using safe optional handling, structs and clear control flow.',
      'Avoid force unwrapping. Be ready to explain guard let and if let.'],
    ['task-security', 'Review incident response', 'Cybersecurity', 'Course instructor', 9, 'Low', 'To do', 2,
      'Explain the stages of a security incident and connect each stage to a practical defensive measure.',
      'Prepare a concise timeline with references to the course materials.'],
    ['task-project', 'Plan the next sprint', 'IT Project Management', 'Project supervisor', -1, 'Medium', 'Completed', 1.5,
      'Break the next AutoCare sprint into small tasks with an owner, acceptance criteria and an estimate.',
      'Review the plan with the team before the next practical session.'],
  ];
  return examples.map(([id, title, course, instructor, days, priority, status, estimatedHours, description, notes]) => ({
    id, title, course, instructor, dueDate: dateIn(days), priority, status,
    estimatedHours, description, notes,
    createdAt: today.toISOString(), updatedAt: today.toISOString(),
  }));
}
