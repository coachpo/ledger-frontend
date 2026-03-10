import { createBrowserRouter, Navigate } from 'react-router-dom'

import { PortfolioDetailPage } from '../pages/portfolio-detail-page'
import { PortfoliosPage } from '../pages/portfolios-page'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/portfolios" />,
  },
  {
    path: '/portfolios',
    element: <PortfoliosPage />,
  },
  {
    path: '/portfolios/:portfolioId',
    element: <PortfolioDetailPage />,
  },
])
