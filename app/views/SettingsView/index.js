import React from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, SafeAreaView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';

import LoggedView from '../View';
import RocketChat from '../../lib/rocketchat';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import RCTextInput from '../../containers/TextInput';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import Loading from '../../containers/Loading';
import { showErrorAlert, showToast } from '../../utils/info';
import log from '../../utils/log';
import { setUser } from '../../actions/login';
import { NavigationControllerManager } from '../../NavigationController';

/** @extends React.Component */
class SettingsView extends LoggedView {
	static propTypes = {
		componentId: PropTypes.any,
		user: PropTypes.object,
		setUser: PropTypes.func
	}

	// eslint-disable-next-line react/sort-comp
	static get options() {
		return {
			topBar: {
				leftButtons: [{
					id: 'Sidemenu',
					title: 'Menu',
					icon: require('../../static/images/navicon_menu.png') // eslint-disable-line
				}],
				title: {
					text: 'Settings'
				}
			}
		};
	}

	constructor(props) {
		super('SettingsView', props);
		this.state = {
			placeholder: {},
			language: props.user ? props.user.language : 'en',
			languages: [{
				label: 'English',
				value: 'en'
			}],
			saving: false
		};
	}

	componentDidMount() {
		NavigationControllerManager.getSharedInstance().setActiveRootComponentId(this.props.componentId, 'SettingsView');
	}

	onNavigationButtonPressed = () => {
		Navigation.mergeOptions(this.props.componentId, {
			sideMenu: {
				left: {
					visible: true
				}
			}
		});
	}

	formIsChanged = () => {
		const { language } = this.state;
		const { user } = this.props;
		return !(user.language === language);
	}

	submit = async() => {
		this.setState({ saving: true });

		const {
			language
		} = this.state;
		const { user } = this.props;

		if (!this.formIsChanged()) {
			return;
		}

		const params = {};

		// language
		if (user.language !== language) {
			params.language = language;
		}

		try {
			await RocketChat.saveUserPreferences(params);
			this.props.setUser({ language: params.language });
			Navigation.mergeOptions(this.props.componentId, {
				topBar: {
					title: {
						text: I18n.t('Settings')
					}
				}
			});

			this.setState({ saving: false });
			setTimeout(() => {
				showToast(I18n.t('Preferences_saved'));
			}, 300);
		} catch (e) {
			this.setState({ saving: false });
			setTimeout(() => {
				if (e && e.error) {
					return showErrorAlert(I18n.t(e.error, e.details));
				}
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
				log('saveUserPreferences', e);
			}, 300);
		}
	}

	render() {
		const { language, languages, placeholder } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='settings-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView testID='settings-view'>
						<RNPickerSelect
							items={languages}
							onValueChange={(value) => {
								this.setState({ language: value });
							}}
							value={language}
							placeholder={placeholder}
						>
							<RCTextInput
								inputRef={(e) => { this.name = e; }}
								label={I18n.t('Language')}
								placeholder={I18n.t('Language')}
								value={language}
								testID='settings-view-language'
							/>
						</RNPickerSelect>
						<View style={sharedStyles.alignItemsFlexStart}>
							<Button
								title={I18n.t('Save_Changes')}
								type='primary'
								onPress={this.submit}
								disabled={!this.formIsChanged()}
								testID='settings-view-button'
							/>
						</View>
						<Loading visible={this.state.saving} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	user: state.login.user
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUser(params))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(SettingsView);