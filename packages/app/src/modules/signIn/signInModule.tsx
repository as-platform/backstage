import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { SignInPage } from '@backstage/core-components';
import {
  configApiRef,
  githubAuthApiRef,
  SignInPageProps,
  useApi,
} from '@backstage/core-plugin-api';

const githubProvider = {
  id: 'github-auth-provider',
  title: 'GitHub',
  message: 'Sign in using GitHub',
  apiRef: githubAuthApiRef,
};

const PlatformSignInPage = (props: SignInPageProps) => {
  const config = useApi(configApiRef);
  const production =
    config.getOptionalString('auth.environment') === 'production';
  const providers = production
    ? [githubProvider]
    : ['guest' as const, githubProvider];

  return <SignInPage {...props} providers={providers} />;
};

const signInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => PlatformSignInPage,
  },
});

export const signInModule = createFrontendModule({
  pluginId: 'app',
  extensions: [signInPage],
});
