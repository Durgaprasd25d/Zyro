import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING } from '../../constants/theme';

export default function SupportScreen({ navigation }) {
    const handleCall = () => Linking.openURL('tel:+919876543210');
    const handleEmail = () => Linking.openURL('mailto:support@zyro.com');
    const handleWhatsApp = () => Linking.openURL('whatsapp://send?phone=+919876543210');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.bw_black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>HELP & SUPPORT</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <Ionicons name="headset-outline" size={64} color={COLORS.bw_black} />
                    <Text style={styles.heroTitle}>How can we assist you?</Text>
                    <Text style={styles.heroSubtitle}>Our specialized team is available to help you with any queries or technical issues.</Text>
                </View>

                <View style={styles.supportOptions}>
                    <SupportItem 
                        icon="call" 
                        title="Voice Call" 
                        subtitle="Immediate assistance via phone"
                        onPress={handleCall}
                    />
                    <SupportItem 
                        icon="logo-whatsapp" 
                        title="WhatsApp Status" 
                        subtitle="Chat with our live support agents"
                        onPress={handleWhatsApp}
                    />
                    <SupportItem 
                        icon="mail" 
                        title="Email Inquiry" 
                        subtitle="Detailed support via electronic mail"
                        onPress={handleEmail}
                    />
                </View>

                <View style={styles.faqSection}>
                    <Text style={styles.sectionTitle}>FREQUENT QUESTIONS</Text>
                    <FAQItem question="How do I update my KYC documents?" answer="Go to Profile > Documents and click on the pending items to re-upload." />
                    <FAQItem question="When will my withdrawal be processed?" answer="Withdrawals usually take 24-48 hours to reflect in your bank account." />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>ZYRO AC TECHNICIAN PORTAL v1.0.4</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SupportItem({ icon, title, subtitle, onPress }) {
    return (
        <TouchableOpacity style={styles.supportItem} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={COLORS.bw_white} />
            </View>
            <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.bw_black} />
        </TouchableOpacity>
    );
}

function FAQItem({ question, answer }) {
    const [expanded, setExpanded] = React.useState(false);
    return (
        <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)}>
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Ionicons name={expanded ? "remove" : "add"} size={20} color={COLORS.bw_black} />
            </View>
            {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bw_white },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bw_border
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 2 },
    content: { padding: SPACING.lg },
    heroSection: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: COLORS.bw_border, marginBottom: 30 },
    heroTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.bw_black, marginTop: 20 },
    heroSubtitle: { fontSize: 14, color: COLORS.grey, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
    supportOptions: { gap: 16, marginBottom: 40 },
    supportItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        backgroundColor: COLORS.bw_white, 
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.bw_border,
        gap: 16
    },
    iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bw_black, justifyContent: 'center', alignItems: 'center' },
    itemText: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.bw_black },
    itemSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
    faqSection: { marginBottom: 40 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 2, marginBottom: 20 },
    faqItem: { borderBottomWidth: 1, borderBottomColor: COLORS.bw_border, paddingVertical: 16 },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { fontSize: 14, fontWeight: '500', color: COLORS.bw_black, flex: 1, paddingRight: 10 },
    faqAnswer: { fontSize: 13, color: COLORS.grey, marginTop: 12, lineHeight: 18 },
    footer: { alignItems: 'center', paddingVertical: 20 },
    footerText: { fontSize: 10, color: COLORS.bw_greyMedium, letterSpacing: 1 },
});
