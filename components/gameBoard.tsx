import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, Vibration, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, WithTimingConfig } from 'react-native-reanimated';

import PositionedDie from '@/components/positionedDie';
import { Combination, DiceZone, DieHandle, TrayBounds } from '@/game/types';

import { Colors } from "@/constants/theme";
import SetupDicePosition from '@/functions/setupDice';
import { useGameState } from "@/game/gameStateContext";
import { useRules } from "@/game/rulesContext";
import { useDicePhysics } from '@/hooks/useDicePhysics';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import { useShakeDrivenForce } from '@/hooks/useShakeDriveForce';

export default function GameBoard({ numDiceInit = 6, dieSize = 60 }: { numDiceInit?: number; dieSize?: number }) {
  const ZONE_INIT = Array(numDiceInit).fill('field')

  const { bankPoints, endTurnWithFarkle, state, addToRunningScore, setIsFarkle, setIsHotDice } = useGameState()
  const {rules} = useRules()

  const currentPlayer = state.players[state.currentPlayerIndex]

  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const positionDiceConfig:WithTimingConfig = {duration:300, easing:Easing.elastic(0.9)}

  const pointsTrayBounds = useSharedValue<TrayBounds>({ x: 0, y: 0, height: 0, width: 0 }); //layout du scored tray
  const zonesShared = Array.from({ length: numDiceInit }, (_, i) => useSharedValue<DiceZone>('field')); // sert a partager l'état ddes zones aux differents composants en temps réel
  const canReroll = useSharedValue(true)

  const [diceTrayBounds, setDiceTrayBounds] = useState<TrayBounds>({ x: 0, y: 0, height: 0, width: 0 });// le layout du field tray
  const [numDice, setNumDice] = useState(numDiceInit) //le nombre de dé en zone 'field'
  const [values, setValues] = useState<number[]>(Array(numDiceInit).fill(1));// valeurs des differents dés.
  const [zones, setZones] = useState<DiceZone[]>(ZONE_INIT); //sert simplement au render
  const [highlightedDieIndexes, setHighlightedDieIndexes] = useState<Array<{ key: number; value: number }>>([{key:-1, value: 0}]);  
  const [canBank, setCanBank] = useState(false)
  const [runningScoreValid, setRunningScoreValid] = useState(false)
  const [showDropInMessage, setShowDropInMessage] = useState(false)
 
  const finishedCount = useRef(0);
  const dieRefs = useRef<(DieHandle | null)[]>([]);
  
  const groupIdsShared = useSharedValue<string[]>(Array(numDiceInit).fill('none'));

  const triggerDiceRoll = () => {
    if(state.isWaitingForNextTurn) return
    if (!canReroll.value) {
      //show an error toast
      return
    } 
    
    //console.log("triggerDiceRoll")
    canReroll.value = false
    setHighlightedDieIndexes([]);
    setCanBank(state.runningScore > 0 && (state.runningScore >= rules.minRunningScoreToScore && currentPlayer.score > 0))
    groupIdsShared.value = Array(numDice).fill('none');
    finishedCount.current = 0;
    dieRefs.current.forEach((dieRef, i) => {
      //console.log(i, "zone", zonesShared[i].value)
      if (zonesShared[i].value === 'scored') 
        zonesShared[i].value = 'locked' //lock die already scored before

      if(zonesShared[i].value === 'field')
        setTimeout(() => dieRef?.roll(), i * 60);
    });
  };

  // détecte un shake pour trigger un nouveau lancer de dés
  useShakeDetector(triggerDiceRoll, { threshold: 1.7, cooldownMs: 1200, updateIntervalMs: 100 });

  const { posX, posY, velX, velY, applyForce, isDragging, isShaking, DIE_RADIUS, locked: lockPhysic } = useDicePhysics(numDiceInit, diceTrayBounds??{x:0, y:0, width:0, height:0}, dieSize, zonesShared);

  useShakeDrivenForce({ onShake: applyForce, idleThreshold: 0.2, isShaking }); // seuil
  
  //assignGroups met en groupe les triplets, quadruplets, etc..., les straight, les triples doublets, etc... 
  // Bref toutes les combinaisons de dés pour ainsi les bank ensemble
  const assignGroups = (faces: number[], combinations: Combination, currentZones: DiceZone[]): string[] => {
    const groupOf = Array(numDiceInit).fill('none');
    const isStraight = Object.values(combinations).every((d) => d.length === 1);
    const pairs = Object.values(combinations).filter((d) => d.length === 2);
    const isThreePairs = pairs.length === 3;

    if (isStraight || isThreePairs) {
        faces.forEach((_, i) => { groupOf[i] = 'all'; });
        return groupOf;
    }

    Object.entries(combinations).forEach(([faceStr, d]) => {
      const diceIndices = d.filter((v) => currentZones[v] != 'scored')
      
      const face = Number(faceStr);
      if (diceIndices.length >= 3) {
          diceIndices.forEach((i) => { groupOf[i] = `triplet-${face}`; });
      } else if (face === 1 || face === 5) {
          diceIndices.forEach((i) => { groupOf[i] = `solo-${i}`; });
      } else {
          diceIndices.forEach((i) => { groupOf[i] = `none-${i}`; });
      }
    });
  
    return groupOf;
  };

  const checkForWinningCombinations = (c: Combination) => {
    const isStraight = Object.values(c).every((d) => d.length === 1);
    const pairs = Object.values(c).filter((d) => d.length === 2);
    const hasPairs = pairs.length >= rules.minPairsForScore;

    //console.log("winningCombinations", {isStraight, pairs, hasPairs})

    return {isStraight, pairs, hasPairs}
  }

  const getFacesRowScore = ({ face, dice }: { face: number, dice: number[] }) => {      
    if (dice.length >= rules.minFacesInRow) {
      if (face === 1) {
        return rules.onesInRowScore + rules.addedFaceToRowScore * ( dice.length - rules.minFacesInRow)
      } else {
        switch (dice.length) {
          case rules.minFacesInRow:
            return face * 100
          default:
            return rules.minFacesInRowExceededScore + rules.addedFaceToRowScore * (dice.length - (rules.minFacesInRow + 1))
        }
      }        
    } else
      return 0
  }

  type CombinationAnalysis = {
    isStraight: boolean;
    pairs: number[][];
    hasPairs: boolean;
    combinations: Combination;
  };

  function buildCombinationAnalysis(faces: number[], indexFilter?: (index: number) => boolean): CombinationAnalysis {
    let combinations: Combination = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    faces.forEach((value, index) => {
        if (indexFilter && !indexFilter(index)) return;
        combinations[value].push(index);
    });

    const { isStraight, hasPairs, pairs } = checkForWinningCombinations(combinations);
    
    //console.log("buildCombinationAnalysis:", { isStraight, pairs, hasPairs, combinations })
    
    return { isStraight, pairs, hasPairs, combinations };
  }

  //analyze le pointage des dés qui sont dans le field, mais drag dans le pointsTray
  function scoreFaces(faces: number[] | undefined): number {
    if (faces === undefined) return 0;
    const { isStraight, pairs, hasPairs, combinations } = buildCombinationAnalysis(faces);
    let score = 0;
    console.log("scoreFaces", faces)
    Object.entries(combinations).forEach(([f, diceIndices]) => {
      if(diceIndices.length === 0) return
      const face = Number(f)
      if (isStraight) {
        //console.log("diceIndices.length >= MIN_ROW:", diceIndices.length >= MIN_ROW, " || isStraight:", isStraight)
        score = rules.straightScore;
      } else if (diceIndices.length >= rules.minFacesInRow) {
        score += getFacesRowScore({ face, dice: diceIndices })
      } else if (hasPairs) {
        //console.log("hasPairs: ", hasPairs, rules.pairScore, '*', pairs.length, '=', rules.pairScore * pairs.length)
        score = rules.pairScore * pairs.length;
      } else if (face === 1 || face === 5) {
        //console.log("face === 1:", face === 1, " || face === 5:", face === 5)
        score += (face === 1 ? 100 : 50) * diceIndices.length;
      }
    });

    return score;
  }

  // analyzeRoll analyse un array de valeurs de dés du field et y applique le groupage, le highlight si le de vaut de quoi etc...
  function analyzeRoll(faces: number[], currentZones: DiceZone[]) {
    const { isStraight, hasPairs, pairs, combinations } = buildCombinationAnalysis(
        faces,
        (index) => currentZones[index] === 'field'
    );

    const highlighted: { key: number; value: number }[] = [];
    let isFarkle = true;

    if (hasPairs) {
      //traité une seule fois, en dehors de la boucle par face
      pairs.forEach((pair) => {
          const face = faces[pair[0]]; // la vraie valeur de CE dé, pas celle de l'itération externe
          pair.forEach((i) => highlighted.push({ key: i, value: faces[i] }));
      });
      isFarkle = false;
    } else {
      Object.entries(combinations).forEach(([f, diceIndices]) => {
          if (diceIndices.length === 0) return;
          const face = Number(f);
          if (diceIndices.length >= rules.minFacesInRow || isStraight) {
              diceIndices.forEach((i) => highlighted.push({ key: i, value: face }));
              isFarkle = false;
          } else if (face === 1 || face === 5) {
              diceIndices.forEach((i) => highlighted.push({ key: i, value: face }));
              isFarkle = false;
          }
      });
    }

    return {
      highlighted,
      groupIds: assignGroups(faces, combinations, currentZones), // voir note
      isFarkle,
    };
}

  //callback utilise par PositionDie execute lorsque le dé finit de tourner
  const handleDieRollEnd = (index: number, value: number, currentZones: SharedValue<DiceZone>[]) => {
    if (currentZones[index].value === 'scored') return
    
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    finishedCount.current++;
    if (finishedCount.current === numDice) {
      // on lit toutes les valeurs à jour via un callback fonctionnel pour éviter le state stale
      setValues((prev) => {
        const { highlighted, groupIds, isFarkle } = analyzeRoll(prev, currentZones.map( v => v.value));
        queueMicrotask(() => {
          setHighlightedDieIndexes(highlighted)
          if (highlighted.length > 0) {
            setShowDropInMessage(true)
          }
          groupIdsShared.value = groupIds
          setIsFarkle(isFarkle)
        })
        
        return prev;
      });
    }
  };
  
  const modifyDieZone = (index: number, newZone: DiceZone) => {
    const movedGroup = groupIdsShared.value[index] //we can still chose which one we pick

    const dieScored = zonesShared[index].value === 'scored'

    let newMovedIndeces: { key: number, value: number }[] = []
    let newZones: DiceZone[] = [...zones]

    //console.log("handleDropInPoints", {droppedGroup, highlightedDieIndexes} )

    let futureRunningScore = 0, currentRunningScore = 0

    const addToZone = ({ zone, index, face } : {zone: DiceZone, index:number, face:number}) => {
      newMovedIndeces.push({key: index, value: face})
      newZones[index] = zone
      zonesShared[index].value = zone
    }

    if (newZone === 'scored') {       
      currentPlayer.score >= rules.winScore - rules.scoreToGoalDifference //are we FLUSH_DIFFERENCE from the winning score?
      ? highlightedDieIndexes?.forEach(({ key, value }) => {
        if(dieScored) return
        addToZone({zone:'scored', index:key, face:value})
      }) // then we put all marked dice into the points tray
      : groupIdsShared.value.forEach((gId, i) => {
        if (gId === movedGroup && !dieScored) {
          addToZone({zone: newZone, index: i, face: values[i]})
        } // we put only the group selected
      }) 

      // modifier leur position 
      newMovedIndeces.forEach(({ key }, order) => {
        const orderOffset = zonesShared.filter(v => v.value !== 'field')?.length || 0
        const pos = SetupDicePosition(order + orderOffset, dieSize, numDiceInit, pointsTrayBounds.value, 8)        
        
        posX[key].value = withTiming(pos.x, positionDiceConfig)
        posY[key].value = withTiming(pos.y, positionDiceConfig)
      }) 

       // augmenter le running score       
      console.log("newScoredIndeces", newMovedIndeces, newMovedIndeces.length)
      currentRunningScore = scoreFaces(newMovedIndeces.map(({ value }) => value))
      
      futureRunningScore = currentRunningScore + state.runningScore
      addToRunningScore(currentRunningScore)
      setNumDice(prev => prev -= newMovedIndeces.length)

      if (newZones.filter(z => z === 'scored').length === numDiceInit) {
        setIsHotDice(true)
      }  
    } else if (newZone === 'field') {
      groupIdsShared.value.forEach((gId, i) => {
        if (gId === movedGroup && dieScored) {
          addToZone({zone:'field', index:i, face: values[i]})
        }
      })

      const { highlighted, groupIds } = analyzeRoll(values, newZones);
      setHighlightedDieIndexes(highlighted);
      groupIdsShared.value = groupIds;

      //diminue le running score
      currentRunningScore = scoreFaces(newMovedIndeces.map(({ value }) => value))      

      futureRunningScore = state.runningScore - currentRunningScore
      addToRunningScore(-currentRunningScore)
      
      const indecesDiceScored = zonesShared.map((v, i) => ({key: i, scored:v.value !== 'field' && groupIdsShared.value[i] != movedGroup})).filter((d) => d.scored)
      
      //console.log("numDiceScored length", indecesDiceScored.length)
      if (indecesDiceScored.length === 0) {        
        canReroll.value = false
      } else {
        //replace les des qui restent
        indecesDiceScored.forEach((v, order) => {
          if (v.scored){
            const pos = SetupDicePosition(order, dieSize, numDiceInit, pointsTrayBounds.value, 8)        
        
            posX[v.key].value = withTiming(pos.x, positionDiceConfig)
            posY[v.key].value = withTiming(pos.y, positionDiceConfig)
          }
        })
      }
      setNumDice((prev) => prev += newMovedIndeces.length)
    }
    //set state post calculations
    //console.log("can bank", {isRunningScoreHighEnough, isRunningScoreUndershot, futureRunningScore} )
    const isRunningScoreHighEnough = currentPlayer.score === 0 ? futureRunningScore >= rules.minRunningScoreToScore : true
    const isRunningScoreUndershot = futureRunningScore <= rules.winScore - currentPlayer.score
    
    setRunningScoreValid(isRunningScoreHighEnough && isRunningScoreUndershot) // is the running score bigger than the difference from the win score and the current score? Cause we need to arrive flush to win score so FARKLE  
    setCanBank(isRunningScoreHighEnough && isRunningScoreUndershot && futureRunningScore > 0)

    if (newZone === 'scored' && !isRunningScoreUndershot){
      setIsFarkle(true)
      return
    }

    setZones(newZones)
  } 

  //callback utilisé par PositionDie exécuté lorsque le dé est dragged dans PointsTray bounds
  //si le dé vaut de quoi, on regarde sil appartient a un groupe et on drag tous les dés du meme groupe dans les PointsTray Bounds
  //on change leur zone pour que la physique ne les influence plus.
  const handleDropInPoints = (index: number) => {
    canReroll.value = true
    setShowDropInMessage(false)
    //check si le de vaut dequoi
    const die = highlightedDieIndexes?.find(({ key, value }) => key === index)
    if (!die) return
    
    // retirer le dé de la zone de jeu et son groupe
    modifyDieZone(index, 'scored')
  }

  const handleDropInField = (index: number) => {
    modifyDieZone(index, 'field')
  }

  const triggerHotDiceVibration = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // un premier "ding" satisfaisant

    for (let i = 0; i < 18; i++) {
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), i * Math.abs(150 - (i * 10)));
    }
  };

  const resetBoard = (callback?:()=>void) => {
    canReroll.value = true
    
    setZones(ZONE_INIT) 
    setNumDice(numDiceInit)
    setHighlightedDieIndexes([])
    zonesShared.map((v, i) => v.value = ZONE_INIT[i])

    lockPhysic.value = true
    
    for (let i = 0; i < numDiceInit; i++){
      velX[i].value = 0;
      velY[i].value = 0; 
      const { x, y } = SetupDicePosition(i, dieSize, numDiceInit, diceTrayBounds, 8)
      posX[i].value = withDelay(300, withTiming(x, positionDiceConfig))
      posY[i].value = withDelay(300, withTiming(y, positionDiceConfig))
    }
    if(callback)
      setTimeout(callback, 300 * (numDiceInit-1))
  }
  const animateMessageConfig:WithTimingConfig = {duration:800, easing:Easing.ease}
  const animatedDropInText = useAnimatedStyle(() => ({
    opacity: showDropInMessage
      ? withRepeat(
          withSequence(
            withTiming(0.3, animateMessageConfig),
            withTiming(0, animateMessageConfig)
          )
      , -1, true)
      : withTiming(0, {...animateMessageConfig, duration:300})
  }))

  // surveille hot dice
  useEffect(() => {    
    if (state.isHotDice) {
      Platform.OS === 'android'
        ? Vibration.vibrate([0, 100, 50, 400], false)
        : triggerHotDiceVibration()  
      resetBoard(() => lockPhysic.value = false)
    }
  }, [state.isHotDice]);

  useEffect(() => {
    if (state.isFarkle) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      resetBoard(() => lockPhysic.value = false)
    }
  }, [state.isFarkle])

  useEffect(() => {
    console.log("isWaitingForNextTurn", state.isWaitingForNextTurn)
    lockPhysic.value = state.isWaitingForNextTurn
  }, [state.isWaitingForNextTurn])

  return (
    <View style={styles.board}>
      <View
        onLayout={(e) => {
          //console.log("dice tray layout:", e.nativeEvent.layout);
          setDiceTrayBounds(e.nativeEvent.layout)
        }}
        style={styles.diceZoneBackground}
      />

      <View
        onLayout={(e) => {
          pointsTrayBounds.value = e.nativeEvent.layout
        }}
        style={styles.pointsZoneBackground}
      >
        <Text style={[styles.runningScore, {color: runningScoreValid ? colors.text : colors.danger}]}>
          {state.runningScore > 0 ? state.runningScore : ''}
        </Text>
        <Animated.Text style={[animatedDropInText, {color:colors.accent, fontSize:64, fontWeight:'bold', letterSpacing:4, top:'25%'}]}>
          Glisse ici
        </Animated.Text>
      </View>
        
      <TouchableOpacity style={[styles.bankBtn, {borderColor: colors.accent, opacity:canBank?1:0.3}]}
        onPress={() => {   
          if (canBank) {
            setCanBank(false)
            resetBoard()
            bankPoints()
          } else {
            //TODO: show explanation
          }          
        }}
        disabled={!canBank}
      >
        <FontAwesome6 name="piggy-bank" size={24} color={colors.accent} />
        <Text style={{color:colors.text, fontSize:24, letterSpacing:0.8}}>BANK</Text>
      </TouchableOpacity>
      
      {Array.from({ length: numDiceInit }).map((_, i) => (
        <PositionedDie
          key={i}
          index={i}
          posX={posX[i]}
          posY={posY[i]}
          velX={velX[i]}
          velY={velY[i]}
          isDragging={isDragging[i]}
          zone={zonesShared[i]}
          groupId={groupIdsShared.value[i]} //un string dictant a quel groupe le de fait partie (utilisee dans handleDropInPoints)
          radius={DIE_RADIUS}
          highlighted={(highlightedDieIndexes?.some((d) => d.key === i) && zones[i] !== 'scored') || false}
          ref={(el) => { dieRefs.current[i] = el }}
          onRollEnd={(value) => handleDieRollEnd(i, value, zonesShared)}
          pointsTrayBounds={pointsTrayBounds.value}
          onDroppedInPoints={(index) => handleDropInPoints(index)}
          onDroppedInField={(index) => handleDropInField(index)}
        />
      ))}      
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  diceZoneBackground: {
    flex:4,
    width: '100%',
  },
  pointsZoneBackground: {
    flex: 3,
    paddingTop:8,
    width: '90%',
    borderWidth: 2,
    borderRadius: 12, 
    borderColor: 'white',
    overflow: 'hidden',
    position:'relative',
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    justifyContent: 'flex-start',
    alignItems:'center'
  },
  runningScore: {
    color: 'white',
    fontSize: 20
  },
  bankBtn: {
    flex: 1,
    height:64,
    width: '90%',
    borderRadius: 16,
    borderWidth:1,
    borderColor: 'gold',
    backgroundColor:'rgba(255, 215, 0, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    gap:8
  }
});