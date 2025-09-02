import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert color="red" title="Something went wrong" icon={<IconAlertCircle />}>
          <Text>An unexpected error occurred. Please try again.</Text>
          <Text c="dimmed" size="xs" mt="sm">
            {this.state.error?.toString()}
          </Text>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
