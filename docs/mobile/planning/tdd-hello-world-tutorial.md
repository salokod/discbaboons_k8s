# TDD React Native Hello World Tutorial

## Overview
Learn React Native fundamentals through Test-Driven Development following Martin Fowler's testing strategies. Each phase follows the Red-Green-Refactor cycle while building confidence with React Native components.

## Learning Objectives
- Understand React Native component hierarchy and rendering
- Master the TDD cycle: Red → Green → Refactor
- Learn React Native testing patterns with Jest and react-test-renderer
- Practice component composition and props
- Build confidence in React Native development workflow

## Prerequisites
- ✅ Monorepo workspace configured
- ✅ Bare React Native app initialized  
- ✅ Node.js 22+ and npm workspaces working

## Phase 1: TDD Hello World Component (20 min)

### Learning Goals
- Write first React Native component test
- Understand component rendering testing
- Practice Red-Green-Refactor cycle

### TDD Cycle 1.1: Basic Component Exists
- [ ] **RED**: Write test that App component renders without crashing
- [ ] **GREEN**: Create minimal App.js that passes test
- [ ] **REFACTOR**: Clean up imports and structure

### TDD Cycle 1.2: Display Hello World Text  
- [ ] **RED**: Write test that App displays "Hello World" text
- [ ] **GREEN**: Add Text component with hardcoded "Hello World"
- [ ] **REFACTOR**: Ensure clean component structure

### Key Teaching Points
- React Native uses `View` instead of `div`
- React Native uses `Text` instead of `span` or `p`
- Testing with `react-test-renderer` and Jest
- How React Native components map to native UI

### Completion Criteria
- [ ] App.test.js has passing tests for component rendering
- [ ] App.js displays "Hello World" in Text component
- [ ] Tests run successfully with `npm test`

---

## Phase 2: TDD Styling (20 min)

### Learning Goals
- Understand React Native StyleSheet API
- Test visual properties of components
- Learn Flexbox layout in React Native context

### TDD Cycle 2.1: Background Color
- [ ] **RED**: Test that container has blue background color
- [ ] **GREEN**: Add StyleSheet with backgroundColor
- [ ] **REFACTOR**: Extract styles object

### TDD Cycle 2.2: Text Styling
- [ ] **RED**: Test that text has specific fontSize and color
- [ ] **GREEN**: Add text styles to StyleSheet
- [ ] **REFACTOR**: Organize styles logically

### TDD Cycle 2.3: Layout with Flexbox
- [ ] **RED**: Test that container centers content
- [ ] **GREEN**: Add flex, justifyContent, alignItems
- [ ] **REFACTOR**: Test style objects directly

### Key Teaching Points
- StyleSheet.create() vs inline styles
- Flexbox defaults in React Native
- How RN styles differ from CSS
- Testing style properties

### Completion Criteria
- [ ] Component has styled container with centered content
- [ ] StyleSheet object is tested independently
- [ ] Visual styles are verified in tests

---

## Phase 3: TDD User Interaction (25 min)

### Learning Goals
- Implement user interaction with TouchableOpacity
- Manage component state with useState hook
- Test user events and state changes

### TDD Cycle 3.1: Button Component
- [ ] **RED**: Test that button exists and is touchable
- [ ] **GREEN**: Add TouchableOpacity component
- [ ] **REFACTOR**: Style button appropriately

### TDD Cycle 3.2: Counter State
- [ ] **RED**: Test button press increments counter display
- [ ] **GREEN**: Add useState for counter, onPress handler
- [ ] **REFACTOR**: Improve test readability

### TDD Cycle 3.3: Interactive Feedback
- [ ] **RED**: Test multiple button presses update display
- [ ] **GREEN**: Ensure state updates work correctly
- [ ] **REFACTOR**: Add better test assertions

### Key Teaching Points
- TouchableOpacity vs Button component
- useState hook for state management
- Testing user interactions
- Component re-rendering on state change

### Completion Criteria
- [ ] Button increments counter when pressed
- [ ] State changes are tested properly
- [ ] Multiple interactions work as expected

---

## Phase 4: TDD Component Composition (15 min)

### Learning Goals
- Extract reusable components
- Pass props between components
- Test component interfaces

### TDD Cycle 4.1: Custom Button Component
- [ ] **RED**: Test Button component accepts title prop
- [ ] **GREEN**: Create separate Button.js component
- [ ] **REFACTOR**: Use Button in App component

### TDD Cycle 4.2: onPress Callback
- [ ] **RED**: Test Button accepts and calls onPress prop
- [ ] **GREEN**: Implement onPress prop handling
- [ ] **REFACTOR**: Test component interface contract

### Key Teaching Points
- Component composition patterns
- Props as component API
- Testing component interfaces
- Reusable component design

### Completion Criteria
- [ ] Separate Button component with props
- [ ] Props are tested properly
- [ ] App uses custom Button component

---

## Phase 5: Integration Testing & Simulator (15 min)

### Learning Goals
- Write integration tests for full user flows
- Test complete user interactions
- Run app in iOS simulator

### Integration Testing
- [ ] **RED**: Test full flow: render → find button → press → verify result
- [ ] **GREEN**: Ensure all components work together
- [ ] **REFACTOR**: Clean up test helpers

### Simulator Testing
- [ ] Run app in iOS simulator
- [ ] Demonstrate Hot Reload functionality
- [ ] Test real user interaction

### Key Teaching Points
- Integration vs unit testing
- React Native development workflow
- Hot Reload and Metro bundler
- Real device testing

### Completion Criteria
- [ ] Integration tests pass
- [ ] App runs successfully in simulator
- [ ] Hot Reload works for development

---

## Success Metrics
- [ ] All TDD cycles completed with passing tests
- [ ] App displays Hello World with styled button
- [ ] Counter increments on button press
- [ ] Custom Button component is reusable
- [ ] App runs in iOS simulator
- [ ] Hot Reload development workflow works

## Common Issues & Solutions
*To be filled in as we encounter them during the tutorial*

## Key Takeaways
*To be completed after finishing all phases*

---

*Last Updated: August 3, 2025*
*Tutorial Status: Ready to Begin*