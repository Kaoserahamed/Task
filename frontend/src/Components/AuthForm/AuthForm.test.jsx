import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthForm from './AuthForm';

const formData = { name: '', email: '', password: '', confirmPassword: '' };

beforeEach(() => {
  formData.name = '';
  formData.email = '';
  formData.password = '';
  formData.confirmPassword = '';
});

test('collects login fields and submits the form', () => {
  const setFormData = jest.fn();
  const handleSubmit = jest.fn((event) => event.preventDefault());

  render(
    <MemoryRouter>
      <AuthForm isLogin formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} />
    </MemoryRouter>
  );

  expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your email')).toHaveValue('');
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
    target: { value: 'ada@example.com' },
  });
  expect(setFormData).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com' }));
  expect(screen.getByRole('link', { name: 'Forgot Password?' })).toHaveAttribute(
    'href',
    '/reset-password'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(handleSubmit).toHaveBeenCalled();
});

test('collects all registration fields', () => {
  const setFormData = jest.fn();
  const handleSubmit = jest.fn((event) => event.preventDefault());

  render(
    <MemoryRouter>
      <AuthForm
        isLogin={false}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
      />
    </MemoryRouter>
  );

  expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Enter your name'), { target: { value: 'Ada' } });
  expect(setFormData).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada' }));
  fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
    target: { value: 'secret123' },
  });
  expect(setFormData).toHaveBeenCalledWith(
    expect.objectContaining({ confirmPassword: 'secret123' })
  );
  expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
});
