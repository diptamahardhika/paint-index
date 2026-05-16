# Contributing to Paint Index

Thank you for your interest in contributing to Paint Index! We appreciate your help in making this paint indexing application better for Citadel and Vallejo users.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** - Click the "Fork" button on GitHub to create your own copy
2. **Clone your fork** - `git clone https://github.com/YOUR_USERNAME/paint-index.git`
3. **Add upstream remote** - `git remote add upstream https://github.com/diptamahardhika/paint-index.git`
4. **Create a branch** - `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Docker (optional, for containerized development)

### Installation

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Start the development server
npm run dev
```

### Project Structure

- **JavaScript/Frontend** - Main application UI and logic (48.6% of codebase)
- **Python/Backend** - API and data processing (21.7% of codebase)
- **CSS/Styling** - Stylesheets and design (16.1% of codebase)
- **HTML** - Template files (13.3% of codebase)
- **Docker** - Containerization configuration (0.3% of codebase)

## Making Changes

### Before You Start

- Check existing [Issues](https://github.com/diptamahardhika/paint-index/issues) and [Pull Requests](https://github.com/diptamahardhika/paint-index/pulls) to avoid duplicating work
- For new features, consider opening an issue first to discuss your approach
- Keep changes focused and atomic - one feature per branch/PR

### Development Workflow

1. **Keep your fork updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/descriptive-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run test      # Run JavaScript tests
   pytest            # Run Python tests
   npm run lint      # Check code style
   ```

## Submitting Changes

### Commit Messages

Write clear, descriptive commit messages:

- Use the imperative mood ("Add feature" not "Added feature")
- Limit the first line to 50 characters
- Reference issues when relevant: "Fixes #123"
- Example:
  ```
  Add paint color matching algorithm
  
  - Implement RGB comparison logic
  - Add unit tests for color matching
  - Fixes #45
  ```

### Pull Request Process

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Use a clear title that describes your changes
   - Reference related issues: "Closes #123"
   - Describe what changes you made and why
   - Include screenshots for UI changes

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of your changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   
   ## Testing
   Describe how you tested your changes
   
   ## Checklist
   - [ ] Tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

4. **Wait for Review**
   - Maintainers will review your PR
   - Make requested changes in new commits
   - Keep the conversation respectful and constructive

## Coding Standards

### JavaScript/CSS

- Use ES6+ syntax
- Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- Use meaningful variable and function names
- Keep functions small and focused
- Comment complex logic

### Python

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use type hints where possible
- Write docstrings for functions and classes
- Keep functions focused and testable

### HTML

- Use semantic HTML5 elements
- Ensure proper indentation (2 spaces)
- Include alt text for images
- Use meaningful class and id names

### CSS

- Use consistent naming conventions (BEM or similar)
- Organize styles logically
- Use variables for colors and common values
- Mobile-first responsive design
- Comment sections for clarity

## Testing

All contributions should include tests:

- Write tests for new features
- Ensure existing tests pass
- Aim for meaningful test coverage
- Test edge cases and error conditions

```bash
# Run all tests
npm run test
pytest

# Run tests in watch mode
npm run test:watch
```

## Documentation

- Update README.md for user-facing changes
- Add docstrings to new functions
- Update API documentation if applicable
- Include examples for new features

## Reporting Bugs

Found a bug? Please report it by creating an issue:

1. **Use a clear, descriptive title**
2. **Describe the exact steps to reproduce**
3. **Include expected vs. actual behavior**
4. **Add screenshots if relevant**
5. **Include your environment details:**
   - OS and browser version
   - Node.js/Python version
   - Any relevant dependencies

Example:
```
Title: Color picker returns incorrect RGB values

Steps to reproduce:
1. Open the color picker
2. Select a pure red color
3. Check the RGB output

Expected: RGB(255, 0, 0)
Actual: RGB(254, 1, 1)

Environment: Chrome 95, Ubuntu 20.04
```

## Suggesting Features

Have an idea for improvement? Please create an issue to discuss it:

1. **Describe the desired feature** - What should it do?
2. **Explain the use case** - Why is this useful?
3. **Suggest implementation** - How might this work?
4. **Include examples** - Show how users would interact with it

## Questions?

- Check existing [Discussions](https://github.com/diptamahardhika/paint-index/discussions)
- Open an issue with your question
- Reach out to the maintainers directly

## Recognition

Contributors will be recognized in the README.md and commit history. Thank you for helping improve Paint Index!

---

**Happy coding! 🎨**
