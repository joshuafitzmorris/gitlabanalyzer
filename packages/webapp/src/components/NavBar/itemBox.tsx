import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import Icon from './iconHelper';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useRepositoryContext } from '../../contexts/RepositoryContext';

interface ListItemBoxProps {
  icon: string;
  primary: string;
  url: string;
}

const useStyles = makeStyles(() => ({
  logoutButton: {
    bottom: '1rem',
    position: 'absolute',
  },
}));

const ItemBox: React.FC<ListItemBoxProps> = (ListItemBoxProps) => {
  const styles = useStyles();
  const { logout } = useAuthContext();
  const { repositoryId } = useRepositoryContext();
  if (ListItemBoxProps.primary == 'Logout') {
    return (
      <ListItem
        button
        component={Link}
        to={ListItemBoxProps.url}
        className={styles.logoutButton}
      >
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.primary == 'Collapse') {
    return (
      <>
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </>
    );
  } else if (ListItemBoxProps.icon == 'user') {
    return (
      <ListItem button>
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.icon == 'logout') {
    return (
      <ListItem
        button
        component={Link}
        to={ListItemBoxProps.url}
        onClick={logout}
      >
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.icon == 'commit' && repositoryId == '') {
    return (
      <ListItem button disabled component={Link} to={ListItemBoxProps.url}>
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.icon == 'graph' && repositoryId == '') {
    return (
      <ListItem button disabled component={Link} to={ListItemBoxProps.url}>
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  } else if (ListItemBoxProps.icon == 'merge' && repositoryId == '') {
    return (
      <ListItem button disabled component={Link} to={ListItemBoxProps.url}>
        <ListItemIcon>
          <Icon icon={ListItemBoxProps.icon} />
        </ListItemIcon>
        <ListItemText primary={ListItemBoxProps.primary} />
      </ListItem>
    );
  }
  return (
    <ListItem button component={Link} to={ListItemBoxProps.url}>
      <ListItemIcon>
        <Icon icon={ListItemBoxProps.icon} />
      </ListItemIcon>
      <ListItemText primary={ListItemBoxProps.primary} />
    </ListItem>
  );
};

export default ItemBox;
