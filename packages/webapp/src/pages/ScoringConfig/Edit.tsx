import React from 'react';
import ScoringConfigForm from '../../components/ScoringConfigForm';
import ScoringLayout from './components/ScoringLayout';
import { useHistory, useLocation } from 'react-router-dom';
import { parse } from 'querystring';
import { ScoringConfig } from '@ceres/types';
import {
  useCreateScoringConfig,
  useGetScoringConfig,
  useUpdateScoringConfig,
} from '../../api/scoringConfig';
import GlobHints from './components/GlobHints';

interface PreloadedFormProps {
  id: string;
}

const PreloadedForm: React.FC<PreloadedFormProps> = ({ id }) => {
  const { data, invalidate } = useGetScoringConfig(id);
  const { mutate: updateScoringConfig } = useUpdateScoringConfig(id);
  const { push } = useHistory();

  const onSubmit = (values: ScoringConfig) => {
    updateScoringConfig(values, {
      onSuccess: () => {
        void invalidate();
        push('/settings/scoring');
      },
    });
  };
  if (data) {
    return (
      <ScoringConfigForm onSubmit={onSubmit} defaultValues={data} requireName />
    );
  }
  return <div>Loading...</div>;
};

const EditScoringConfigPage: React.FC = () => {
  const { mutate: createScoringConfig } = useCreateScoringConfig();
  const { push } = useHistory();
  const location = useLocation();
  const query = parse(location.search.replace(/^\?/, ''));

  const onSubmit = (values: ScoringConfig) => {
    createScoringConfig(values, {
      onSuccess: () => {
        push('/scoring');
      },
    });
  };

  return (
    <ScoringLayout>
      <GlobHints />
      {query.id ? (
        <PreloadedForm id={query.id as string} />
      ) : (
        <ScoringConfigForm onSubmit={onSubmit} requireName />
      )}
    </ScoringLayout>
  );
};

export default EditScoringConfigPage;
