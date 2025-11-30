import { RouteNamesEnum } from 'localConstants';
import { Dashboard, Disclaimer, Home, AllContracts } from 'pages';
import { CreateContract } from 'pages/CreateContract';
import { LandlordContracts, TenantContracts } from 'pages/MyContracts';
import { ContractDetails } from 'pages/ContractDetails';
import { RouteType } from 'types';

interface RouteWithTitleType extends RouteType {
  title: string;
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Dashboard
  },
  {
    path: RouteNamesEnum.dashboard,
    title: 'Dashboard',
    component: Dashboard
  },
  {
    path: RouteNamesEnum.disclaimer,
    title: 'Disclaimer',
    component: Disclaimer
  },
  {
    path: RouteNamesEnum.create,
    title: 'Create Contract',
    component: CreateContract
  },
  {
    path: RouteNamesEnum.landlord,
    title: 'My Properties',
    component: LandlordContracts
  },
  {
    path: RouteNamesEnum.tenant,
    title: 'My Rentals',
    component: TenantContracts
  },
  {
    path: RouteNamesEnum.contracts,
    title: 'All Contracts',
    component: AllContracts
  },
  {
    path: RouteNamesEnum.contract,
    title: 'Contract Details',
    component: ContractDetails
  }
];
