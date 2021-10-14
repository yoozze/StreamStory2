import React, { ChangeEvent, useState } from 'react';

import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import InfoIcon from '@material-ui/icons/Info';
import LockIcon from '@material-ui/icons/Lock';
import SettingsIcon from '@material-ui/icons/Settings';

import PageTitle from '../components/PageTitle';
import Tab from '../components/Tab';
import TabPanel, { getTabA11yProps } from '../components/TabPanel';
import UserProfileChangePasswordForm from '../components/UserProfileChangePasswordForm';
import UserProfileDeleteAccountForm from '../components/UserProfileDeleteAccountForm';
import UserProfileDetailsForm from '../components/UserProfileDetailsForm';
import UserProfileSettingsForm from '../components/UserProfileSettingsForm';

import useStyles from './UserProfile.styles';

export interface UserProfileUrlParams {
    tab?: string;
}

const basePath = '/profile';
const tabPaths = ['details', 'settings', 'change-password', 'delete-account'];

function UserProfile(): JSX.Element {
    const classes = useStyles();
    const { t } = useTranslation();
    const params = useParams<UserProfileUrlParams>();
    const [tabValue, setTabValue] = useState(params.tab || tabPaths[0]);

    const profileTabPrefix = 'profile';

    function handleChange(event: ChangeEvent<Record<string, never>>, newValue: string) {
        setTabValue(newValue);
    }

    return (
        <>
            <PageTitle gutterBottom>{t('my_profile')}</PageTitle>

            <Paper className={classes.root} square>
                <Tabs
                    value={tabValue}
                    variant="scrollable"
                    scrollButtons="auto"
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={handleChange}
                    aria-label={t('my_profile')}
                    // centered
                >
                    <Tab
                        component={RouterLink}
                        to={`${basePath}/${tabPaths[0]}`}
                        value={tabPaths[0]}
                        label={t('details')}
                        icon={<InfoIcon fontSize="small" />}
                        {...getTabA11yProps(tabPaths[0], profileTabPrefix)}
                    />
                    <Tab
                        component={RouterLink}
                        to={`${basePath}/${tabPaths[1]}`}
                        value={tabPaths[1]}
                        label={t('settings')}
                        icon={<SettingsIcon fontSize="small" />}
                        {...getTabA11yProps(tabPaths[1], profileTabPrefix)}
                    />
                    <Tab
                        component={RouterLink}
                        to={`${basePath}/${tabPaths[2]}`}
                        value={tabPaths[2]}
                        label={t('change_password')}
                        icon={<LockIcon fontSize="small" />}
                        {...getTabA11yProps(tabPaths[2], profileTabPrefix)}
                    />
                    <Tab
                        component={RouterLink}
                        to={`${basePath}/${tabPaths[3]}`}
                        value={tabPaths[3]}
                        label={t('delete_account')}
                        icon={<DeleteForeverIcon fontSize="small" />}
                        {...getTabA11yProps(tabPaths[3], profileTabPrefix)}
                    />
                </Tabs>
            </Paper>
            <TabPanel value={tabValue} index={tabPaths[0]} prefix={profileTabPrefix}>
                <UserProfileDetailsForm />
            </TabPanel>
            <TabPanel value={tabValue} index={tabPaths[1]} prefix={profileTabPrefix}>
                <UserProfileSettingsForm />
            </TabPanel>
            <TabPanel value={tabValue} index={tabPaths[2]} prefix={profileTabPrefix}>
                <UserProfileChangePasswordForm />
            </TabPanel>
            <TabPanel value={tabValue} index={tabPaths[3]} prefix={profileTabPrefix}>
                <UserProfileDeleteAccountForm />
            </TabPanel>
        </>
    );
}

export default UserProfile;
