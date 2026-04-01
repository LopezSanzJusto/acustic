// components/tourDetails/tourPointList.tsx

import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { PointOfInterest } from '../../data/points';
import { useCustomRoute } from '../../hooks/useCustomRoute';

import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

interface TourPointListProps {
  points: PointOfInterest[];
  hasAccess?: boolean;
  headerComponent?: React.ReactElement | null; 
  footerComponent?: React.ReactElement | null; 
}

export const TourPointList = ({ points, hasAccess = true, headerComponent, footerComponent }: TourPointListProps) => {
  const { customPoints, setInitialPoints, togglePointVisibility, reorderPoints } = useCustomRoute();

  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  const listData = useMemo(() => {
    let visibleCounter = 0;
    return customPoints.map(point => {
      if (!point.isHidden) visibleCounter++;
      return { 
        ...point, 
        displayNumber: point.isHidden ? null : visibleCounter 
      };
    });
  }, [customPoints]);

// ✅ CORRECCIÓN DE ESCALADO VISUAL
  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<any>) => (
    // 1. El wrapper con el padding se queda FUERA para que los márgenes no crezcan
    <View style={styles.itemWrapper}>
      
      {/* 2. El ScaleDecorator envuelve SOLO la tarjeta, y controlamos su tamaño (1.02) */}
      <ScaleDecorator activeScale={1.02}>
        <View 
          style={[
            styles.row, 
            item.isHidden && styles.rowHidden,
            isActive && styles.rowActive 
          ]}
        >
          <Image 
            source={{ uri: item.image }} 
            style={[styles.image, item.isHidden && styles.imageHidden]} 
          />
          
          <View style={styles.textContainer}>
            <Text style={[styles.pointName, item.isHidden && styles.textHidden]} numberOfLines={2}>
              {item.displayNumber ? `${item.displayNumber}. ` : ''}{item.name}
            </Text>
          </View>

          {hasAccess && (
            <>
              <RNTouchableOpacity 
                onPress={() => togglePointVisibility(item.id)}
                style={styles.iconButton}
              >
                 <Ionicons 
                   name={item.isHidden ? "eye-off-outline" : "eye-outline"} 
                   size={24} 
                   color={item.isHidden ? COLORS.muted : COLORS.textDark} 
                 />
              </RNTouchableOpacity>

              <GHTouchableOpacity onPressIn={drag} style={styles.dragHandle}>
                 <Ionicons 
                   name="menu-outline" 
                   size={24} 
                   color={isActive ? COLORS.primary : COLORS.muted} 
                 />
              </GHTouchableOpacity>
            </>
          )}
        </View>
      </ScaleDecorator>
    </View>
  ), [hasAccess, togglePointVisibility]);

  // ⚠️ EL RETURN ANTICIPADO AHORA ESTÁ DEBAJO DE TODOS LOS HOOKS
  if (customPoints.length === 0) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {headerComponent}
        {footerComponent}
      </ScrollView>
    );
  }

  return (
    <DraggableFlatList
      data={listData}
      keyExtractor={(item) => item.id}
      onDragEnd={({ from, to }) => reorderPoints(from, to)}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListHeaderComponent={
        <View>
          {headerComponent}
          <View style={styles.listHeaderContainer}>
            <Text style={styles.header}>
              {hasAccess ? "Personaliza tu ruta" : "Puntos del recorrido"}
            </Text>

            {hasAccess && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>Arrastra desde el icono derecho para reordenar o toca el ojo para ocultar paradas.</Text>
              </View>
            )}
          </View>
        </View>
      }
      ListFooterComponent={
        <View>
          {footerComponent}
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listHeaderContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  itemWrapper: { paddingHorizontal: 20 },
  header: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F3E8FF', padding: 12, borderRadius: 12, marginBottom: 15, alignItems: 'center', gap: 10 },
  infoText: { fontSize: 12, color: COLORS.primary, flex: 1, lineHeight: 18 },
  row: { 
    flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10,
    backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border 
  },
  rowHidden: { backgroundColor: '#f9f9f9', borderColor: '#eaeaea' },
  rowActive: { 
    elevation: 8, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5,
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary
  },
  image: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  imageHidden: { opacity: 0.5 },
  textContainer: { flex: 1, justifyContent: 'center' },
  pointName: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  textHidden: { color: COLORS.muted, textDecorationLine: 'line-through' },
  iconButton: { padding: 5, marginRight: 5 },
  dragHandle: { padding: 10 }
});