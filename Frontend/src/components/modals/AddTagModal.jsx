import { Modal, View, TextInput, TouchableOpacity, Text, TouchableWithoutFeedback, ScrollView } from "react-native"
import styles from '../../screens/tasks/actionScreen.styles'
import { useEffect, useState } from "react";
import { contextModal } from '../../styles/globalStyles'
import contextService from "../../services/context/contextService";
import Colors from "../../styles/colors";
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import taskService from "../../services/task/taskService";
import tagService from "../../services/tag/tagService";



const AddTagModal = (props) => {

    const [tag, setTag] = useState([]);

    const onNameChange = (text) => {
        setTag(text)
    };
    const OutSide = ({ onCloseModal, isModalOpen }) => {
        const view = <View style={{ flex: 1, width: '100%' }} />;
        if (!isModalOpen) return view;
        return (
            <TouchableWithoutFeedback onPress={() => { onCloseModal() }} style={{ flex: 1, width: '100%' }}>
                {view}
            </TouchableWithoutFeedback>
        );
    }
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={props.modalVisible}
            onRequestClose={() => props.setState({ ...props.state, showTagSelector: false })}
        >
            <View style={styles.stateModalContainer}>
                <OutSide isModalOpen={props.modalVisible} onCloseModal={props.onCloseModal} />
                <View style={styles.modalStyle}>
                    <TextInput
                        style={{ color: '#182E44', fontSize: 16, fontWeight: 'normal', width: '100%', marginBottom: 5 }}
                        placeholder="Nueva etiqueta"
                        onEndEditing={() => { console.log("THIS END") }}
                        maxLength={50}
                        multiline={true}
                    />
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => onAcceptFunction()}>
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal >
    )
}


export default AddTagModal;