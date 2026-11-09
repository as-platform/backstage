import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('asks for a GitHub sign-in without a guest option in production', async () => {
    process.env = {
      NODE_ENV: 'test',
      APP_CONFIG: [
        {
          data: {
            app: { title: 'Test' },
            backend: { baseUrl: 'http://localhost:7007' },
            auth: { environment: 'production' },
          },
          context: 'test',
        },
      ] as any,
    };

    render(App.createRoot());

    expect(await screen.findByText('Sign in using GitHub')).toBeInTheDocument();
    expect(screen.queryByText(/guest/i)).not.toBeInTheDocument();
  });
});
