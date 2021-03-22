import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ListItem, ListItemText, SvgIcon } from '@material-ui/core';
import Icon from './iconHelper';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useRepositoryContext } from '../../contexts/RepositoryContext';

interface ListItemBoxProps {
  icon: string;
  primary: string;
  url?: string;
  repositoryDependent?: boolean;
}

const useStyles = makeStyles(() => ({
  logoutButton: {
    color: 'white',
    bottom: '1.5rem',
    position: 'absolute',
    display: 'flex',
    width: '6rem',
    alignItems: 'center',
    flexDirection: 'column',
  },
  iconStyle: {
    fontSize: '3.5vh',
    color: 'white',
  },
  buttonStyle: {
    color: 'white',
    display: 'flex',
    width: '6rem',
    alignItems: 'center',
    flexDirection: 'column',
    textAlign: 'center',
  },
}));
const ItemBox: React.FC<ListItemBoxProps> = (ListItemBoxProps) => {
  const styles = useStyles();
  const { logout } = useAuthContext();
  const { repositoryId } = useRepositoryContext();
  const activeRoute = (routeName: any) => {
    const location = useLocation();
    const parsed_location = location.pathname.split('?')[0];
    const parsed_route = routeName.split('?')[0];
    return parsed_location === parsed_route;
  };

  if (ListItemBoxProps.icon == 'user') {
    return (
      <ListItem button className={styles.buttonStyle}>
        <SvgIcon className={styles.iconStyle}>
          <Icon icon={ListItemBoxProps.icon} />
        </SvgIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.icon == 'logout') {
    return (
      <ListItem
        button
        component={Link}
        to={ListItemBoxProps.url}
        className={styles.logoutButton}
        onClick={logout}
      >
        <SvgIcon className={styles.iconStyle}>
          <Icon icon={ListItemBoxProps.icon} />
        </SvgIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.repositoryDependent && repositoryId == '') {
    return (
      <ListItem button disabled className={styles.buttonStyle}>
        <SvgIcon className={styles.iconStyle}>
          <Icon icon={ListItemBoxProps.icon} />
        </SvgIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  }
  return (
    <ListItem
      button
      component={NavLink}
      exact
      to={ListItemBoxProps.url}
      activeStyle={{ color: '#0A4D63', background: 'white' }}
      className={styles.buttonStyle}
    >
      <SvgIcon
        className={styles.iconStyle}
        style={{
          color: activeRoute(ListItemBoxProps.url) ? '#0A4D63' : 'white',
        }}
      >
        <Icon icon={ListItemBoxProps.icon} />
      </SvgIcon>
      <ListItemText primary={ListItemBoxProps.primary} />
    </ListItem>
  );
};

export default ItemBox;
