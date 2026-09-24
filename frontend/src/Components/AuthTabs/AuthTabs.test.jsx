import { fireEvent, render, screen } from '@testing-library/react';
import AuthTabs from './AuthTabs';

test('switches between login and registration tabs', () => {
  const setIsLogin = jest.fn();
  render(<AuthTabs isLogin setIsLogin={setIsLogin} />);

  expect(screen.getByRole('button', { name: 'Login' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: 'Sign Up' })).not.toHaveClass('active');

  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
  expect(setIsLogin).toHaveBeenCalledWith(false);
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(setIsLogin).toHaveBeenCalledWith(true);
});
