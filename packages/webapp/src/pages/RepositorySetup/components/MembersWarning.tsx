import { Commit } from '@ceres/types';
import Alert from '@material-ui/lab/Alert';
import React from 'react';
import { useRepositoryAuthors } from '../../../api/author';

interface MembersWarningProps {
  repositoryId: string;
}

function countOrphanAuthors(authors: Commit.Author[]) {
  return authors.filter((author) => !author.repository_member_id).length;
}

const MembersWarning: React.FC<MembersWarningProps> = ({ repositoryId }) => {
  const { data } = useRepositoryAuthors(repositoryId);
  const orphanCount = countOrphanAuthors(data || []);
  if (orphanCount === 0) {
    return null;
  }
  return (
    <Alert severity='warning'>
      There are <strong>{orphanCount}</strong> commit authors that are not
      linked to a repository member.
    </Alert>
  );
};

export default MembersWarning;
