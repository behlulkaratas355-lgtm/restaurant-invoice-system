import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginView from '../pages/LoginView';
import DashboardView from '../pages/DashboardView';
import RestaurantsView from '../pages/RestaurantsView';
import ProductsView from '../pages/ProductsView';
import ProductAnalysisView from '../pages/ProductAnalysisView';
import InvoicesView from '../pages/InvoicesView';
import UploadView from '../pages/UploadView';
import AdminView from '../pages/AdminView';
import UnauthorizedView from '../pages/UnauthorizedView';
import ProtectedRoute from '../components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'login',
        element: <LoginView />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'restaurants',
        element: (
          <ProtectedRoute>
            <RestaurantsView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products',
        element: (
          <ProtectedRoute>
            <ProductsView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'product-analysis',
        element: (
          <ProtectedRoute>
            <ProductAnalysisView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'invoices',
        element: (
          <ProtectedRoute>
            <InvoicesView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'upload',
        element: (
          <ProtectedRoute>
            <UploadView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedView />,
      },
    ],
  },
]);

export default router;
