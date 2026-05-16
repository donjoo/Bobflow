import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BobFlow header', () => {
  render(<App />);
  expect(screen.getByText(/BobFlow/i)).toBeInTheDocument();
});
