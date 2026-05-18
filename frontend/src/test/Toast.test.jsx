import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../context/ToastContext';

function TestComponent() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Saved!')}>Success</button>
      <button onClick={() => toast.error('Failed!')}>Error</button>
      <button onClick={() => toast.info('FYI')}>Info</button>
      <button onClick={() => toast.cart('Added to cart')}>Cart</button>
    </div>
  );
}

function renderWithToast() {
  return render(
    <ToastProvider>
      <TestComponent />
    </ToastProvider>
  );
}

describe('ToastContext', () => {
  it('shows a success toast', async () => {
    renderWithToast();
    await act(async () => fireEvent.click(screen.getByText('Success')));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    renderWithToast();
    await act(async () => fireEvent.click(screen.getByText('Error')));
    expect(screen.getByText('Failed!')).toBeInTheDocument();
  });

  it('shows an info toast', async () => {
    renderWithToast();
    await act(async () => fireEvent.click(screen.getByText('Info')));
    expect(screen.getByText('FYI')).toBeInTheDocument();
  });

  it('shows a cart toast', async () => {
    renderWithToast();
    await act(async () => fireEvent.click(screen.getByText('Cart')));
    expect(screen.getByText('Added to cart')).toBeInTheDocument();
  });

  it('renders toast with role="alert" for accessibility', async () => {
    renderWithToast();
    await act(async () => fireEvent.click(screen.getByText('Success')));
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('toast can be dismissed', async () => {
    renderWithToast();
    await act(async () => fireEvent.click(screen.getByText('Success')));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss');
    await act(async () => fireEvent.click(dismissBtn));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });
});
