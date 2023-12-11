import { useState, useContext } from 'react';
import { TextInput, View, Button, Text } from 'react-native';
import styles from './login.styles'
import AuthContext from './authContext';

function SignInScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const { signIn } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login Into TFG-GTD App</Text>
            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.textInput}
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.textInput}
                secureTextEntry
            />
            <Button title="Sign in" onPress={() => signIn({ username, password })} />
        </View>
    );
}

export default SignInScreen;